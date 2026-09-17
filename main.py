from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx
import os

app = FastAPI(title="Healthcare AI API")

# Enable CORS for local web clients and testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


class HealthRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    patient_context: str | None = Field(default=None, max_length=8000)


class HealthResponse(BaseModel):
    answer: str
    warning: str


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/healthcare/ask", response_model=HealthResponse)
async def ask_healthcare_ai(request: HealthRequest):
    context = request.patient_context or "No patient context provided."

    prompt = f"""
You are a healthcare information assistant.

Important rules:
- Do not claim to diagnose a patient.
- Do not prescribe medication or give personalized treatment instructions.
- Identify urgent warning signs and recommend contacting a qualified healthcare professional.
- Clearly state uncertainty.
- Provide general educational information only.
- Do not invent medical facts or citations.

Patient context:
{context}

User question:
{request.question}

Return a concise, plain-language answer.
"""

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()

        answer = data.get("response", "").strip()

        if not answer:
            raise HTTPException(
                status_code=502,
                detail="The AI service returned an empty response."
            )

        return HealthResponse(
            answer=answer,
            warning=(
                "This is general health information, not a diagnosis or "
                "medical advice. Contact a qualified healthcare professional "
                "for personal guidance. For emergencies, contact local "
                "emergency services."
            )
        )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start it with: ollama serve"
        )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {str(error)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
