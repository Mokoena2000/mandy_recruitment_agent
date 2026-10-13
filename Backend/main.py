import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

#load all env 
load_dotenv()

supabase_url: str = os.getenv("SUPABASE_URL")
supabase_key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
n8n_webhook: str = os.getenv("N8N_WEBHOOK_URL")
frontend_url: str = os.getenv("FRONTEND_URL")

app = FastAPI(title="Mandy Recruitment Assistant Api", description="Origami AI Recruitment Assistant Responsible for schedueling interviews reviewwing candidate CV and matching with job description sending and recieving emails from candidate and recuitment")

# Give access to my frontend url to be able to communicate with the backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for data validation and api endpoint 

class StatusUpdate(BaseModel):
    status: str

@app.get("/health")
def health_check():
    return {"status": "Hooray Mandy is online and ready to help with some awesome recruitment"}

@app.get("/candidates")
def get_candidates():
    # get all candidates from supabase
    response = supabase.table('candidates').select("*").execute()
    return response.data

@app.patch("/candidates{candidate_id}/status")
async def update_candidate_status(candidate_id: str, payload: StatusUpdate, background_task: BackgroundTasks):

    # update table based of agent and recruitment decision and outcomes

    try:
        update_res = supabase.table('candidates').update(
            {"status": payload.status}
        ).eq('id', candidate_id).execute()

    except Exception as e:
        raise HTTPException(status_code=500, default=str(e))


    return {"message": "Status updated successfully", "data": update_res.data}


    #n8n workflow webhook connection, responsible to connect to n8n for emails

    async def trigger_n8n_webhook(candidate_id: str, status: str):
        async with httpx.AsyncClient() as client:
            payload = {"candidate_id": candidate_id, "status": status}
            await client.post(n8n_webhook, json=payload)

