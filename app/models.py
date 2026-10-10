from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User Models ---
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    full_name: str
    role: str = "support_agent" # support_agent, support_lead, director, superroot

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Ticket & Passport Models ---
class TicketPassportUpdate(BaseModel):
    # Level 1: Category & Subcategory
    category: Optional[str] = None
    subcategory: Optional[str] = None
    
    # Level 2: 7 Passport Fields
    user_id: Optional[str] = None
    device: Optional[str] = None
    operator: Optional[str] = None
    app: Optional[str] = None
    problem: Optional[str] = None
    cause: Optional[str] = None
    result: Optional[str] = None
    
    # Extra technical telemetry
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    protocol: Optional[str] = None
    server: Optional[str] = None
    
    # Operational flags
    severity: Optional[str] = None
    status: Optional[str] = None
    instruction_helped: Optional[bool] = None
    escalated_to_engineer: Optional[bool] = None
    csat_score: Optional[int] = None

class TicketCreate(BaseModel):
    channel: str # 'telegram' | 'instagram'
    channel_user_id: str
    channel_user_name: Optional[str] = None
    channel_user_handle: Optional[str] = None
    initial_message: Optional[str] = None
    severity: str = "P2"

class MessageCreate(BaseModel):
    ticket_id: int
    message_text: str
    sender_type: str = "operator" # 'client', 'operator', 'system', 'ai'
    media_type: Optional[str] = None
    media_url: Optional[str] = None

class MessageOut(BaseModel):
    id: int
    ticket_id: int
    sender_type: str
    sender_name: Optional[str] = None
    sender_id: Optional[str] = None
    message_text: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    created_at: str

class TicketOut(BaseModel):
    id: int
    ticket_number: str
    channel: str
    channel_user_id: str
    channel_user_name: Optional[str] = None
    channel_user_handle: Optional[str] = None
    telegram_topic_id: Optional[int] = None
    status: str
    severity: str
    
    category: Optional[str] = None
    subcategory: Optional[str] = None
    
    user_id: Optional[str] = None
    device: Optional[str] = None
    operator: Optional[str] = None
    app: Optional[str] = None
    problem: Optional[str] = None
    cause: Optional[str] = None
    result: Optional[str] = None
    
    os_version: Optional[str] = None
    app_version: Optional[str] = None
    protocol: Optional[str] = None
    server: Optional[str] = None
    
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    created_at: str
    updated_at: str
    first_response_at: Optional[str] = None
    resolved_at: Optional[str] = None
    resolution_time_sec: Optional[int] = None
    
    is_reopened: bool = False
    instruction_helped: Optional[bool] = None
    escalated_to_engineer: bool = False
    csat_score: Optional[int] = None
    
    ai_triaged: bool = False
    ai_diagnostic_summary: Optional[str] = None
    ai_suggested_reply: Optional[str] = None
    ai_confidence: Optional[float] = 0.0
    
    unread_count: int = 0
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None

# --- VPN Key & Client Models ---
class VpnKeyOut(BaseModel):
    id: int
    user_id: str
    channel: str
    username: Optional[str] = None
    subscription_status: str
    expires_at: Optional[str] = None
    server: str
    protocol: str
    key_string: str
    traffic_used_gb: float
    traffic_limit_gb: float

class RecreateKeyRequest(BaseModel):
    ticket_id: Optional[int] = None
    protocol: Optional[str] = "Vless"
    server: Optional[str] = "NL-03"

# --- Problem Register & Backlog ---
class ProblemRegisterItem(BaseModel):
    id: Optional[int] = None
    problem_code: str
    title: str
    category: str
    device: Optional[str] = None
    operator: Optional[str] = None
    app: Optional[str] = None
    server: Optional[str] = None
    occurrences_count: int = 0
    affected_users_count: int = 0
    status: str = "investigating" # 'unknown', 'investigating', 'app_bug', 'server_overload', 'bad_guide', 'resolved'
    root_cause: Optional[str] = None
    workaround: Optional[str] = None
    permanent_fix: Optional[str] = None
    backlog_priority: str = "P2"
    estimated_weekly_tickets: int = 0
    estimated_hours_saved_monthly: float = 0.0
    created_at: Optional[str] = None

class ProductBacklogItem(BaseModel):
    id: Optional[int] = None
    problem_id: Optional[int] = None
    problem_code: Optional[str] = None
    priority: str = "P1" # P0, P1, P2, P3
    title: str
    description: Optional[str] = None
    impact_tickets_per_week: int = 0
    impact_hours_per_month: float = 0.0
    responsible_team: str = "Development"
    status: str = "backlog" # backlog, in_dev, testing, released

# --- Knowledge Base ---
class KnowledgeArticleItem(BaseModel):
    id: Optional[int] = None
    title: str
    category: str
    subcategory: Optional[str] = None
    device: Optional[str] = None
    app: Optional[str] = None
    content: str
    short_answer: Optional[str] = None
    images_json: Optional[str] = None
    is_active: bool = True
    views_count: int = 0
    useful_count: int = 0

# --- Analytics & Reporting Payloads ---
class VpnHealthOverview(BaseModel):
    total_users: int = 40000
    active_users: int
    working_normally_users: int
    working_normally_pct: float
    problem_users: int
    problem_users_pct: float
    unknown_status_users: int
    unknown_status_pct: float
    inactive_users: int
    inactive_users_pct: float
    user_problem_rate_pct: float
    
    total_tickets_period: int
    resolved_pct: float
    escalated_pct: float
    median_resolution_time_min: float
    first_contact_resolution_pct: float
    csat_pct: float
    automation_rate_pct: float
    reopen_rate_pct: float

class TopProblemStat(BaseModel):
    rank: int
    name: str
    count: int
    share_pct: float
    trend_pct: float
    top_devices: List[Dict[str, Any]]
    top_operators: List[Dict[str, Any]]
    top_apps: List[Dict[str, Any]]

class DrilldownAnomaly(BaseModel):
    combination: str
    category: str
    device: str
    operator: str
    app: str
    occurrences: int
    unique_users: int
    percentage_of_category: float
    linked_problem_code: Optional[str] = None
    alert_level: str # 'CRITICAL', 'WARNING', 'INFO'

# --- OpenRouter & AI Models ---
class AiTriageResult(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    device: Optional[str] = None
    operator: Optional[str] = None
    app: Optional[str] = None
    problem: Optional[str] = None
    cause: Optional[str] = None
    severity: str = "P2"
    diagnostic_summary: str
    confidence: float

class AiSuggestionResult(BaseModel):
    suggested_reply: str
    suggested_action: Optional[str] = None # e.g. "send_key", "send_ios_guide", "escalate"
    model_used: str
    confidence: float
