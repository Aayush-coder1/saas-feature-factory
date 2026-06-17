"""
Templates for the Spec Agent's analysis and blueprint generation.

In production mode, these are used as LLM prompts.
In local mode, they guide the template-based generation logic.
"""

ANALYSIS_PROMPT = """You are a Product Spec Agent. A user has requested a new feature for a SaaS application.

User Request: {user_request}

Existing Codebase Structure:
{codebase_map}

Create a detailed implementation blueprint with:
1. Summary of the feature
2. Files to create (with paths)
3. Files to modify (with paths)
4. API endpoints needed (method, path, request/response shapes)
5. Data model changes
6. Test scenarios to cover
7. Estimated complexity (low/medium/high)

Return ONLY a JSON object with the blueprint.
"""

FEATURE_REQUEST_SCHEMA = {
    "title": "string - Feature title",
    "description": "string - Detailed description",
    "priority": "low|medium|high",
    "type": "api|frontend|auth|integration|ui",
}

BLUEPRINT_SCHEMA = {
    "feature": "string - Feature name",
    "summary": "string - One-line summary",
    "complexity": "low|medium|high",
    "files_to_create": ["list of relative file paths"],
    "files_to_modify": ["list of relative file paths"],
    "api_endpoints": [
        {
            "method": "GET|POST|PUT|DELETE",
            "path": "/api/...",
            "description": "What this endpoint does",
            "request_body": {},
            "response_shape": {},
        }
    ],
    "data_changes": "string - Description of data model changes",
    "test_scenarios": ["list of test case descriptions"],
}
