import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from agent import evaluate_cv
import fitz
from fastapi import UploadFile, File, Form
from agent import evaluate_cv
import requests  

#load all env 
load_dotenv()

supabase_url: str = os.getenv("SUPABASE_URL")
supabase_key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
n8n_webhook: str = os.getenv("N8N_WEBHOOK_URL")
webhook_url: str = os.getenv("WEBHOOK_URL")

app = FastAPI(title="Mandy Recruitment Assistant Api", description="Origami AI Recruitment Assistant Responsible for schedueling interviews reviewwing candidate CV and matching with job description sending and recieving emails from candidate and recuitment")

# Give access to my frontend url to be able to communicate with the backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for data validation and api endpoint 
class StatusUpdate(BaseModel):
    status: str

# Define the webhook trigger function
def trigger_n8n_webhook(candidate_data: dict):
    try:
        requests.post(n8n_webhook, json=candidate_data)
    except Exception as e:
        print(f"n8n webhook failed: {e}")

def ping_recruiter_webhook(candidate_data: dict):
    try:
        requests.post(webhook_url, json=candidate_data)
        print("Recruiter ping sent!")
    except Exception as e:
        print(f"Recruiter ping failed: {e}")

@app.get("/health")
def health_check():
    return {"status": "Hooray Mandy is online and ready to help with some awesome recruitment"}

@app.get("/candidates")
def get_candidates():
    # get all candidates from supabase
    response = supabase.table('candidates').select("*").execute()
    return response.data

# Fix the missing slash in the path parameter
@app.patch("/candidates/{candidate_id}/status")
async def update_candidate_status(candidate_id: str, payload: StatusUpdate, background_task: BackgroundTasks):
    try:
        update_res = supabase.table('candidates').update(
            {"status": payload.status}
        ).eq('id', candidate_id).execute()

        # Actually trigger the background task if the update was successful
        if update_res.data:
            candidate_data = update_res.data[0]
            background_task.add_task(trigger_n8n_webhook, candidate_data)

    except Exception as e:
        #  Fix 'default' to 'detail'
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Status updated successfully", "data": update_res.data}

# update the candidates application 
class ActionUpdate(BaseModel):
    action: str

@app.post("/candidates/{candidate_id}/decision")
async def process_decision(candidate_id: str, payload: ActionUpdate, background_task: BackgroundTasks):
    new_status = 'unsuccessfull' if payload.action == 'reject' else 'interviewing'
   
   # Update the status in supabase
    supabase.table('candidates').update({"status": new_status}).eq('id', candidate_id).execute()

    # trigger n8n webhook for email delivery
    background_task.add_task(n8n_webhook, candidate_id, payload.action)

    return {"status": "success", "action_triggered": payload.action}

# evaluate the candidate cv and update supabase

class EvaluationRequest(BaseModel):
    cv_text: str
    job_description: str

@app.post("/candidates/{candiate_id}/evaluate")
async def trigger_evaluation(candidate_id: str, payload: EvaluationRequest):

    #run agent
    evaluation = evaluate_cv(payload.cv_text, payload.job_description)


    supabase.table('candidates').update({
        "ats_score": evaluation.ats_score,
        "match_summary": evaluation.match_summary,
        "strenghts": evaluation.strenghts,
        "weaknesses": evaluation.weaknesses
        }).eq('id', candidate_id).execute()

    return {"status": "Eveluation complete", "data": evaluation.model_dump()}

# cv upload endpoint
@app.post("/apply")
async def submit_application(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    cv_file: UploadFile = File(...)
):

    # read pdf files
    file_bytes = await cv_file.read()

    # extract the text from the pdf for agent to read
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    cv_text = "".join(page.get_text() for page in doc)

    # read the job description
    with open("job_descriptions.md", "r") as file:
        description = file.read()

    evaluation = evaluate_cv(role, cv_text, description)

    # save candidate info to supabase
    result = supabase.table('candidates').insert({
        "name": name,
        "email": email,
        "role": role,
        "status": "pending",
        "ats_score": evaluation.ats_score,
        "match_summary": evaluation.match_summary,
        "strenghts": evaluation.strenghts,
        "weaknesses": evaluation.weaknesses
    }).execute()

    # ping recruitment after cv upload
    if result.data:
        candidate_data = result.data[0]
        background_tasks.add_task(ping_recruiter_webhook, candidate_data)

    return {"message": "Application evaluated and saved!", "candidate": result.data }



    