import json
import os
import re

from google import genai
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=dotenv_path)

MODEL = "gemini-2.5-flash"

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are the generation engine behind VisionCraftAI.

Return ONLY valid JSON with the exact structure below. 
Keep all generated text, descriptions, and code files concise, clean, and high-quality. 
Strictly limit output size: generate exactly 1 key code file, exactly 3 slides, and exactly 2 marketing posts to ensure super fast generation times under 4 seconds.

{
  "name": "Name of the startup",
  "blueprint": {
    "executive_summary": "High-level summary of the startup blueprint",
    "problem_analysis": "Analysis of the target problem",
    "solution_overview": "How the startup resolves the problem",
    "revenue_model": "Revenue model details",
    "tech_stack": "Recommended technical stack"
  },
  "code": {
    "files": [
      {
        "name": "Filename (exactly 1 file, e.g., App.js or index.html)",
        "content": "Fully-functional code content for this single file"
      }
    ]
  },
  "advisor": {
    "deck": [
      {
        "title": "Slide Title (exactly 3 slides total)",
        "content": "Bullet points or paragraph detail"
      }
    ]
  },
  "marketing": {
    "posts": [
      {
        "platform": "Platform Name (exactly 2 posts total)",
        "content": "Drafted copy/content for the social media post, complete with hashtags"
      }
    ]
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

        data = extract_json(response.text)

        # Normalize and validate structure to prevent frontend crashes
        if not isinstance(data, dict):
            data = {}

        data.setdefault("name", "Unnamed Startup")

        blueprint = data.setdefault("blueprint", {})
        if not isinstance(blueprint, dict):
            blueprint = {}
            data["blueprint"] = blueprint
        blueprint.setdefault("executive_summary", "No summary generated.")
        blueprint.setdefault("problem_analysis", "No problem analysis generated.")
        blueprint.setdefault("solution_overview", "No solution overview generated.")
        blueprint.setdefault("revenue_model", "No revenue model generated.")
        blueprint.setdefault("tech_stack", "No tech stack generated.")

        code = data.setdefault("code", {})
        if not isinstance(code, dict):
            code = {}
            data["code"] = code
        files = code.setdefault("files", [])
        if not isinstance(files, list):
            code["files"] = []
        else:
            cleaned_files = []
            for f in files:
                if isinstance(f, dict):
                    name = f.get("name") or f.get("filename") or "untitled"
                    content = f.get("content") or f.get("code") or ""
                    cleaned_files.append({"name": str(name), "content": str(content)})
            code["files"] = cleaned_files

        advisor = data.setdefault("advisor", {})
        if not isinstance(advisor, dict):
            advisor = {}
            data["advisor"] = advisor
        deck = advisor.setdefault("deck", [])
        if not isinstance(deck, list):
            advisor["deck"] = []
        else:
            cleaned_deck = []
            for d in deck:
                if isinstance(d, dict):
                    title = d.get("title") or "Slide"
                    content = d.get("content") or d.get("body") or ""
                    cleaned_deck.append({"title": str(title), "content": str(content)})
            advisor["deck"] = cleaned_deck

        marketing = data.setdefault("marketing", {})
        if not isinstance(marketing, dict):
            marketing = {}
            data["marketing"] = marketing
        posts = marketing.setdefault("posts", [])
        if not isinstance(posts, list):
            marketing["posts"] = []
        else:
            cleaned_posts = []
            for p in posts:
                if isinstance(p, dict):
                    platform = p.get("platform") or "Social Media"
                    content = p.get("content") or p.get("body") or ""
                    cleaned_posts.append({"platform": str(platform), "content": str(content)})
            marketing["posts"] = cleaned_posts

        return data

    except Exception as e:
        raise GenerationError(str(e))