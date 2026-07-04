import json
import os
import re

from google import genai
from dotenv import load_dotenv

load_dotenv()

MODEL = "gemini-2.5-flash"

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are the generation engine behind VisionCraftAI.

Return ONLY valid JSON.

{
  "name":"",
  "blueprint":{
    "executive_summary":"",
    "problem_analysis":"",
    "solution_overview":"",
    "revenue_model":"",
    "tech_stack":""
  },
  "code":{
    "files":[]
  },
  "advisor":{
    "deck":[]
  },
  "marketing":{
    "posts":[]
  }
}
"""


class GenerationError(Exception):
    pass


def extract_json(text):
    text = text.strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if match:
        text = match.group(0)

    return json.loads(text)


def generate_startup(idea, audience, problem):

    prompt = f"""
Startup Idea:
{idea}

Audience:
{audience}

Problem:
{problem}

{SYSTEM_PROMPT}
"""

    try:

        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
        )

        return extract_json(response.text)

    except Exception as e:
        raise GenerationError(str(e))