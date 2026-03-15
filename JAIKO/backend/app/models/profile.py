from datetime import datetime
from ..extensions import db


class Profile(db.Model):
    __tablename__ = "profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(30), nullable=True)    # male | female | non_binary | other
    profession = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    budget_min = db.Column(db.Integer, nullable=True)
    budget_max = db.Column(db.Integer, nullable=True)
    pets = db.Column(db.Boolean, default=False)
    smoker = db.Column(db.Boolean, default=False)
    # schedule: morning | afternoon | night | flexible
    schedule = db.Column(db.String(30), nullable=True)
    diseases = db.Column(db.Text, nullable=True)        # optional health notes
    profile_photo_url = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(100), nullable=True, default="Asunción")
    verified = db.Column(db.Boolean, default=False)
    verification_status = db.Column(db.String(30), default="not_requested")
    # not_requested | pending_verification | verified | rejected
    is_looking = db.Column(db.Boolean, default=True)   # actively searching
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = db.relationship("User", back_populates="profile")

    def to_dict(self, include_private: bool = False) -> dict:
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "profession": self.profession,
            "bio": self.bio,
            "budget_min": self.budget_min,
            "budget_max": self.budget_max,
            "pets": self.pets,
            "smoker": self.smoker,
            "schedule": self.schedule,
            "profile_photo_url": self.profile_photo_url,
            "city": self.city,
            "verified": self.verified,
            "verification_status": self.verification_status,
            "is_looking": self.is_looking,
            "created_at": self.created_at.isoformat(),
        }
        if include_private:
            data["diseases"] = self.diseases
        return data
