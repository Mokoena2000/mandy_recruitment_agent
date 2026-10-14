import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field 

# the output schema i want mandy to follow
class CandidateEvaluation(BaseModel):
    ats_score: int = Field(description="Score from 0 to 100 based on the job description match.")
    match_summary: str = Field(description="A clear, 3 sentence summary of why this candidate is or is not a fit.")
    strenghts: list[str] = Field(description="List of 3 to 5 core core strenghts found in the CV.")
    weaknesses: list[str] = Field(description="List of 1 to 3 missing requirements or weaknesses.")

   #load the env key and init gemini
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")) 


def evaluate_cv(cv_text: str, job_description: str) -> CandidateEvaluation:
    prompt = f"""
    You name is Mandy you are an expert technical recruiter  for Origami.
    You do not opperate like a norman ATS system but a seaoned recuiting agent with compesion and an eye for detail.
    You job is to anssist the recruitment team and make their work easier in finding the perfect candidate.
    You understand the tech stack for Origami and the Job description.
    Analyze the candidates CV against the provided Job description.

    Job description:
    {job_description}

    Candidate CV:
    {cv_text}
    """

    # ai agent json output for n8n to be able to read and parse it
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mine_type="application/json",
            response_schema=CandidateEvaluation,
            temperature=0.1,
        ),
    )

    return CandidateEvaluation.model_validate_json(response.text)
