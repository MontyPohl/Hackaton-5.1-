from datetime import datetime
from ..extensions import db


class Listing(db.Model):
    __tablename__ = "listings"

    id          = db.Column(db.Integer, primary_key=True)
    owner_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    city        = db.Column(db.String(100), nullable=False, default="Asunción")
    neighborhood = db.Column(db.String(100), nullable=True)
    address     = db.Column(db.String(300), nullable=True)
    latitude    = db.Column(db.Float, nullable=True)
    longitude   = db.Column(db.Float, nullable=True)
    total_price = db.Column(db.Integer, nullable=False)   # en Guaraníes (PYG)
    rooms       = db.Column(db.Integer, nullable=False, default=1)
    bathrooms   = db.Column(db.Integer, nullable=True, default=1)
    max_people  = db.Column(db.Integer, nullable=False, default=2)
    pets_allowed     = db.Column(db.Boolean, default=False)
    smoking_allowed  = db.Column(db.Boolean, default=False)
    furnished        = db.Column(db.Boolean, default=False)
    type    = db.Column(db.String(30), default="apartment")  # apartment | room | house
    status  = db.Column(db.String(20), default="active")     # active | rented | paused | deleted

    # ── NUEVAS COLUMNAS: preferencias del roomie ─────────────────────────────
    #
    # preferred_gender: el género que el dueño prefiere para su roomie.
    #   Valores válidos: 'any' | 'male' | 'female' | 'non_binary'
    #   Default 'any' → sin preferencia de género.
    #
    # min_age_required: edad mínima que el dueño pide para el roomie.
    #   Default 18 → la mayoría de edad legal mínima para un contrato.
    #
    # nullable=True en ambas para compatibilidad con registros anteriores
    # que ya existen en la BD sin estos campos.
    preferred_gender  = db.Column(db.String(30), nullable=True, default="any")
    min_age_required  = db.Column(db.Integer,    nullable=True, default=18)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner   = db.relationship("User", back_populates="listings")
    photos  = db.relationship("ListingPhoto", back_populates="listing", cascade="all, delete-orphan")
    reviews = db.relationship("Review", back_populates="listing")

    def to_dict(self) -> dict:
        return {
            "id":              self.id,
            "owner_id":        self.owner_id,
            "title":           self.title,
            "description":     self.description,
            "city":            self.city,
            "neighborhood":    self.neighborhood,
            "address":         self.address,
            "latitude":        self.latitude,
            "longitude":       self.longitude,
            "total_price":     self.total_price,
            "rooms":           self.rooms,
            "bathrooms":       self.bathrooms,
            "max_people":      self.max_people,
            "pets_allowed":    self.pets_allowed,
            "smoking_allowed": self.smoking_allowed,
            "furnished":       self.furnished,
            "type":            self.type,
            "status":          self.status,
            # Nuevos campos incluidos en la respuesta al frontend
            "preferred_gender":  self.preferred_gender or "any",
            "min_age_required":  self.min_age_required if self.min_age_required is not None else 18,
            "photos":          [p.to_dict() for p in self.photos],
            "created_at":      self.created_at.isoformat(),
        }


class ListingPhoto(db.Model):
    __tablename__ = "listing_photos"

    id         = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id"), nullable=False)
    photo_url  = db.Column(db.String(500), nullable=False)
    order      = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    listing = db.relationship("Listing", back_populates="photos")

    def to_dict(self) -> dict:
        return {"id": self.id, "photo_url": self.photo_url, "order": self.order}
