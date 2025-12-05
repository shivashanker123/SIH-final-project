"""Community models for forum functionality."""
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Community(Base, TimestampMixin):
    """Community/Forum."""
    __tablename__ = "communities"
    
    community_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # Mental Health, Academic, Wellness, etc.
    owner_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    owner = relationship("Student", foreign_keys=[owner_id])
    members = relationship("CommunityMembership", back_populates="community", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="community", cascade="all, delete-orphan")


class CommunityMembership(Base, TimestampMixin):
    """Community membership tracking."""
    __tablename__ = "community_memberships"
    
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    community_id = Column(String, ForeignKey("communities.community_id"), nullable=False)
    
    # Relationships
    student = relationship("Student")
    community = relationship("Community", back_populates="members")


class Post(Base, TimestampMixin):
    """Post in a community."""
    __tablename__ = "posts"
    
    post_id = Column(String, unique=True, index=True, nullable=False)
    community_id = Column(String, ForeignKey("communities.community_id"), nullable=False)
    author_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String)
    video_url = Column(String)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    
    # Relationships
    community = relationship("Community", back_populates="posts")
    author = relationship("Student")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class PostLike(Base, TimestampMixin):
    """Post likes."""
    __tablename__ = "post_likes"
    
    post_id = Column(String, ForeignKey("posts.post_id"), nullable=False)
    student_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    
    # Relationships
    post = relationship("Post", back_populates="likes")
    student = relationship("Student")


class Comment(Base, TimestampMixin):
    """Comments on posts."""
    __tablename__ = "comments"
    
    comment_id = Column(String, unique=True, index=True, nullable=False)
    post_id = Column(String, ForeignKey("posts.post_id"), nullable=False)
    author_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    content = Column(Text, nullable=False)
    likes_count = Column(Integer, default=0)
    
    # Relationships
    post = relationship("Post", back_populates="comments")
    author = relationship("Student")


class Connection(Base, TimestampMixin):
    """Peer-to-peer connections between students."""
    __tablename__ = "connections"
    
    connection_id = Column(String, unique=True, index=True, nullable=False)
    student1_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    student2_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    status = Column(String, default="pending")  # pending, accepted, rejected
    initiated_by = Column(String, nullable=False)  # student1_id or student2_id
    
    # Relationships
    student1 = relationship("Student", foreign_keys=[student1_id])
    student2 = relationship("Student", foreign_keys=[student2_id])


class Message(Base, TimestampMixin):
    """Peer-to-peer messages."""
    __tablename__ = "messages"
    
    message_id = Column(String, unique=True, index=True, nullable=False)
    connection_id = Column(String, ForeignKey("connections.connection_id"), nullable=False)
    sender_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    receiver_id = Column(String, ForeignKey("students.student_id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    # Relationships
    connection = relationship("Connection")
    sender = relationship("Student", foreign_keys=[sender_id])
    receiver = relationship("Student", foreign_keys=[receiver_id])

