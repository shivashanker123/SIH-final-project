"""Community API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import structlog

from app.db.database import get_db
from app.models.student import Student
from app.models.community import (
    Community, CommunityMembership, Post, PostLike, 
    Comment, Connection, Message
)

logger = structlog.get_logger()
router = APIRouter(prefix="/api/community", tags=["community"])


# ============ SCHEMAS ============

class UserProfileResponse(BaseModel):
    student_id: str
    anonymized_name: str
    major: Optional[str]
    bio: str
    followers_count: int
    following_count: int
    communities_count: int
    posts_count: int
    join_date: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    major: Optional[str] = None
    anonymized_name: Optional[str] = None


class CommunityCreate(BaseModel):
    name: str
    description: str
    category: str


class CommunityResponse(BaseModel):
    community_id: str
    name: str
    description: str
    category: str
    owner_id: str
    owner_name: str
    members_count: int
    is_joined: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    community_id: str
    title: str
    content: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class PostResponse(BaseModel):
    post_id: str
    community_id: str
    community_name: str
    author_id: str
    author_name: str
    title: str
    content: str
    image_url: Optional[str]
    video_url: Optional[str]
    likes_count: int
    comments_count: int
    is_liked: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    post_id: str
    content: str


class CommentResponse(BaseModel):
    comment_id: str
    post_id: str
    author_id: str
    author_name: str
    content: str
    likes_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConnectionRequest(BaseModel):
    student2_id: str


class ConnectionResponse(BaseModel):
    connection_id: str
    student1_id: str
    student1_name: str
    student2_id: str
    student2_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    receiver_id: str
    content: str


class MessageResponse(BaseModel):
    message_id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserSearchResponse(BaseModel):
    student_id: str
    anonymized_name: str
    major: Optional[str]
    bio: Optional[str]
    is_connected: bool
    connection_status: Optional[str]  # pending, accepted, rejected, none


# ============ HELPER FUNCTIONS ============

def get_student_by_id(db: Session, student_id: str) -> Student:
    """Get student by ID or raise 404."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


# ============ USER PROFILE ENDPOINTS ============

@router.get("/profile/{student_id}", response_model=UserProfileResponse)
async def get_user_profile(student_id: str, db: Session = Depends(get_db)):
    """Get user profile with counts."""
    student = get_student_by_id(db, student_id)
    
    # Count followers (students who follow this student)
    followers_count = db.query(Connection).filter(
        and_(
            Connection.student2_id == student_id,
            Connection.status == "accepted"
        )
    ).count()
    
    # Count following (students this student follows)
    following_count = db.query(Connection).filter(
        and_(
            Connection.student1_id == student_id,
            Connection.status == "accepted"
        )
    ).count()
    
    # Count communities
    communities_count = db.query(CommunityMembership).filter(
        CommunityMembership.student_id == student_id
    ).count()
    
    # Count posts
    posts_count = db.query(Post).filter(Post.author_id == student_id).count()
    
    return UserProfileResponse(
        student_id=student.student_id,
        anonymized_name=student.anonymized_name or student.name or "Anonymous",
        major=student.major,
        bio=student.bio or "",
        followers_count=followers_count,
        following_count=following_count,
        communities_count=communities_count,
        posts_count=posts_count,
        join_date=student.created_at
    )


@router.put("/profile/{student_id}", response_model=UserProfileResponse)
async def update_user_profile(
    student_id: str,
    update: UserProfileUpdate,
    db: Session = Depends(get_db)
):
    """Update user profile."""
    from app.api.auth import generate_anonymized_name
    
    student = get_student_by_id(db, student_id)
    
    if update.bio is not None:
        student.bio = update.bio
    if update.major is not None:
        student.major = update.major
    if update.anonymized_name is not None:
        if student.is_admin:
            # Ensure admin names maintain (admin) suffix
            if not update.anonymized_name.endswith('(admin)'):
                # Extract username and re-format
                username = update.anonymized_name.replace('(admin)', '').strip()
                student.anonymized_name = generate_anonymized_name(username, is_admin=True)
            else:
                student.anonymized_name = update.anonymized_name
        else:
            student.anonymized_name = update.anonymized_name
    
    db.commit()
    db.refresh(student)
    
    return await get_user_profile(student_id, db)


# ============ COMMUNITY ENDPOINTS ============

@router.post("/communities", response_model=CommunityResponse)
async def create_community(
    community: CommunityCreate,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Create a new community."""
    get_student_by_id(db, student_id)  # Verify student exists
    
    community_id = f"comm_{uuid.uuid4().hex[:12]}"
    
    new_community = Community(
        community_id=community_id,
        name=community.name,
        description=community.description,
        category=community.category,
        owner_id=student_id
    )
    
    db.add(new_community)
    
    # Auto-join creator as member
    membership = CommunityMembership(
        student_id=student_id,
        community_id=community_id
    )
    db.add(membership)
    
    db.commit()
    db.refresh(new_community)
    
    owner = get_student_by_id(db, student_id)
    
    return CommunityResponse(
        community_id=new_community.community_id,
        name=new_community.name,
        description=new_community.description,
        category=new_community.category,
        owner_id=new_community.owner_id,
        owner_name=owner.anonymized_name or owner.name or "Anonymous",
        members_count=1,
        is_joined=True,
        created_at=new_community.created_at
    )


@router.get("/communities", response_model=List[CommunityResponse])
async def list_communities(
    student_id: str = Query(..., description="Current student ID"),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all communities."""
    query = db.query(Community).filter(Community.is_active == True)
    
    if category:
        query = query.filter(Community.category == category)
    
    communities = query.all()
    
    result = []
    for comm in communities:
        # Count members
        members_count = db.query(CommunityMembership).filter(
            CommunityMembership.community_id == comm.community_id
        ).count()
        
        # Check if student is member
        is_joined = db.query(CommunityMembership).filter(
            and_(
                CommunityMembership.community_id == comm.community_id,
                CommunityMembership.student_id == student_id
            )
        ).first() is not None
        
        owner = get_student_by_id(db, comm.owner_id)
        
        result.append(CommunityResponse(
            community_id=comm.community_id,
            name=comm.name,
            description=comm.description,
            category=comm.category,
            owner_id=comm.owner_id,
            owner_name=owner.anonymized_name or owner.name or "Anonymous",
            members_count=members_count,
            is_joined=is_joined,
            created_at=comm.created_at
        ))
    
    return result


@router.post("/communities/{community_id}/join")
async def join_community(
    community_id: str,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Join a community."""
    community = db.query(Community).filter(Community.community_id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Check if already a member
    existing = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.student_id == student_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    
    membership = CommunityMembership(
        student_id=student_id,
        community_id=community_id
    )
    db.add(membership)
    db.commit()
    
    return {"message": "Joined community successfully"}


@router.delete("/communities/{community_id}/leave")
async def leave_community(
    community_id: str,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Leave a community."""
    membership = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == community_id,
            CommunityMembership.student_id == student_id
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this community")
    
    db.delete(membership)
    db.commit()
    
    return {"message": "Left community successfully"}


# ============ POST ENDPOINTS ============

@router.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Create a new post."""
    # Verify community exists and student is member
    membership = db.query(CommunityMembership).filter(
        and_(
            CommunityMembership.community_id == post.community_id,
            CommunityMembership.student_id == student_id
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Must be a member to post")
    
    post_id = f"post_{uuid.uuid4().hex[:12]}"
    
    new_post = Post(
        post_id=post_id,
        community_id=post.community_id,
        author_id=student_id,
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        video_url=post.video_url,
        likes_count=0,
        comments_count=0
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    community = db.query(Community).filter(Community.community_id == post.community_id).first()
    author = get_student_by_id(db, student_id)
    
    return PostResponse(
        post_id=new_post.post_id,
        community_id=new_post.community_id,
        community_name=community.name if community else "Unknown",
        author_id=new_post.author_id,
        author_name=author.anonymized_name or author.name or "Anonymous",
        title=new_post.title,
        content=new_post.content,
        image_url=new_post.image_url,
        video_url=new_post.video_url,
        likes_count=0,
        comments_count=0,
        is_liked=False,
        created_at=new_post.created_at
    )


@router.get("/posts", response_model=List[PostResponse])
async def list_posts(
    student_id: str = Query(..., description="Current student ID"),
    community_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """List posts."""
    query = db.query(Post)
    
    if community_id:
        query = query.filter(Post.community_id == community_id)
    
    posts = query.order_by(Post.created_at.desc()).limit(limit).offset(offset).all()
    
    result = []
    for post in posts:
        community = db.query(Community).filter(Community.community_id == post.community_id).first()
        author = get_student_by_id(db, post.author_id)
        
        # Check if liked
        is_liked = db.query(PostLike).filter(
            and_(
                PostLike.post_id == post.post_id,
                PostLike.student_id == student_id
            )
        ).first() is not None
        
        result.append(PostResponse(
            post_id=post.post_id,
            community_id=post.community_id,
            community_name=community.name if community else "Unknown",
            author_id=post.author_id,
            author_name=author.anonymized_name or author.name or "Anonymous",
            title=post.title,
            content=post.content,
            image_url=post.image_url,
            video_url=post.video_url,
            likes_count=post.likes_count,
            comments_count=post.comments_count,
            is_liked=is_liked,
            created_at=post.created_at
        ))
    
    return result


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: str,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Like or unlike a post."""
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = db.query(PostLike).filter(
        and_(
            PostLike.post_id == post_id,
            PostLike.student_id == student_id
        )
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        # Like
        like = PostLike(post_id=post_id, student_id=student_id)
        db.add(like)
        post.likes_count += 1
    
    db.commit()
    return {"likes_count": post.likes_count, "is_liked": existing_like is None}


# ============ CONNECTION ENDPOINTS ============

@router.post("/connections", response_model=ConnectionResponse)
async def create_connection(
    request: ConnectionRequest,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Send a connection request."""
    if student_id == request.student2_id:
        raise HTTPException(status_code=400, detail="Cannot connect to yourself")
    
    get_student_by_id(db, request.student2_id)  # Verify target exists
    
    # Check if connection already exists
    existing = db.query(Connection).filter(
        or_(
            and_(
                Connection.student1_id == student_id,
                Connection.student2_id == request.student2_id
            ),
            and_(
                Connection.student1_id == request.student2_id,
                Connection.student2_id == student_id
            )
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection_id = f"conn_{uuid.uuid4().hex[:12]}"
    
    connection = Connection(
        connection_id=connection_id,
        student1_id=student_id,
        student2_id=request.student2_id,
        status="pending",
        initiated_by=student_id
    )
    
    db.add(connection)
    db.commit()
    db.refresh(connection)
    
    student1 = get_student_by_id(db, student_id)
    student2 = get_student_by_id(db, request.student2_id)
    
    return ConnectionResponse(
        connection_id=connection.connection_id,
        student1_id=connection.student1_id,
        student1_name=student1.anonymized_name or student1.name or "Anonymous",
        student2_id=connection.student2_id,
        student2_name=student2.anonymized_name or student2.name or "Anonymous",
        status=connection.status,
        created_at=connection.created_at
    )


@router.get("/connections", response_model=List[ConnectionResponse])
async def list_connections(
    student_id: str = Query(..., description="Current student ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    db: Session = Depends(get_db)
):
    """List connections for a student."""
    query = db.query(Connection).filter(
        or_(
            Connection.student1_id == student_id,
            Connection.student2_id == student_id
        )
    )
    
    if status_filter:
        query = query.filter(Connection.status == status_filter)
    
    connections = query.all()
    
    result = []
    for conn in connections:
        student1 = get_student_by_id(db, conn.student1_id)
        student2 = get_student_by_id(db, conn.student2_id)
        
        result.append(ConnectionResponse(
            connection_id=conn.connection_id,
            student1_id=conn.student1_id,
            student1_name=student1.anonymized_name or student1.name or "Anonymous",
            student2_id=conn.student2_id,
            student2_name=student2.anonymized_name or student2.name or "Anonymous",
            status=conn.status,
            created_at=conn.created_at
        ))
    
    return result


@router.post("/connections/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Accept a connection request."""
    connection = db.query(Connection).filter(Connection.connection_id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection.student2_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this connection")
    
    if connection.status != "pending":
        raise HTTPException(status_code=400, detail="Connection is not pending")
    
    connection.status = "accepted"
    db.commit()
    
    return {"message": "Connection accepted"}


@router.post("/connections/{connection_id}/reject")
async def reject_connection(
    connection_id: str,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Reject a connection request."""
    connection = db.query(Connection).filter(Connection.connection_id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection.student2_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this connection")
    
    connection.status = "rejected"
    db.commit()
    
    return {"message": "Connection rejected"}


# ============ MESSAGE ENDPOINTS ============

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    student_id: str = Query(..., description="Current student ID"),
    db: Session = Depends(get_db)
):
    """Send a peer-to-peer message."""
    # Verify connection exists and is accepted
    connection = db.query(Connection).filter(
        or_(
            and_(
                Connection.student1_id == student_id,
                Connection.student2_id == message.receiver_id,
                Connection.status == "accepted"
            ),
            and_(
                Connection.student1_id == message.receiver_id,
                Connection.student2_id == student_id,
                Connection.status == "accepted"
            )
        )
    ).first()
    
    if not connection:
        raise HTTPException(status_code=403, detail="No active connection with this user")
    
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    
    new_message = Message(
        message_id=message_id,
        connection_id=connection.connection_id,
        sender_id=student_id,
        receiver_id=message.receiver_id,
        content=message.content,
        is_read=False
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    sender = get_student_by_id(db, student_id)
    receiver = get_student_by_id(db, message.receiver_id)
    
    return MessageResponse(
        message_id=new_message.message_id,
        sender_id=new_message.sender_id,
        sender_name=sender.anonymized_name or sender.name or "Anonymous",
        receiver_id=new_message.receiver_id,
        receiver_name=receiver.anonymized_name or receiver.name or "Anonymous",
        content=new_message.content,
        is_read=new_message.is_read,
        created_at=new_message.created_at
    )


@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    student_id: str = Query(..., description="Current student ID"),
    other_student_id: Optional[str] = Query(None, description="Filter by conversation partner"),
    limit: int = Query(100, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Get messages for a student."""
    query = db.query(Message).filter(
        or_(
            Message.sender_id == student_id,
            Message.receiver_id == student_id
        )
    )
    
    if other_student_id:
        query = query.filter(
            or_(
                and_(Message.sender_id == student_id, Message.receiver_id == other_student_id),
                and_(Message.sender_id == other_student_id, Message.receiver_id == student_id)
            )
        )
    
    messages = query.order_by(Message.created_at.asc()).limit(limit).offset(offset).all()
    
    result = []
    for msg in messages:
        sender = get_student_by_id(db, msg.sender_id)
        receiver = get_student_by_id(db, msg.receiver_id)
        
        result.append(MessageResponse(
            message_id=msg.message_id,
            sender_id=msg.sender_id,
            sender_name=sender.anonymized_name or sender.name or "Anonymous",
            receiver_id=msg.receiver_id,
            receiver_name=receiver.anonymized_name or receiver.name or "Anonymous",
            content=msg.content,
            is_read=msg.is_read,
            created_at=msg.created_at
        ))
    
    return result


# ============ SEARCH ENDPOINTS ============

@router.get("/search/users", response_model=List[UserSearchResponse])
async def search_users(
    query: str = Query(..., description="Search query"),
    student_id: str = Query(..., description="Current student ID"),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Search for users by anonymized name or major."""
    search_term = f"%{query}%"
    
    students = db.query(Student).filter(
        and_(
            Student.student_id != student_id,
            or_(
                Student.anonymized_name.ilike(search_term),
                Student.major.ilike(search_term),
                Student.bio.ilike(search_term)
            )
        )
    ).limit(limit).all()
    
    result = []
    for student in students:
        # Check connection status
        connection = db.query(Connection).filter(
            or_(
                and_(
                    Connection.student1_id == student_id,
                    Connection.student2_id == student.student_id
                ),
                and_(
                    Connection.student1_id == student.student_id,
                    Connection.student2_id == student_id
                )
            )
        ).first()
        
        is_connected = connection is not None and connection.status == "accepted"
        connection_status = connection.status if connection else "none"
        
        result.append(UserSearchResponse(
            student_id=student.student_id,
            anonymized_name=student.anonymized_name or student.name or "Anonymous",
            major=student.major,
            bio=student.bio,
            is_connected=is_connected,
            connection_status=connection_status
        ))
    
    return result

