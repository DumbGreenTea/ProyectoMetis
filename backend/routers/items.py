from fastapi import APIRouter, HTTPException
from typing import List
from models.item import Item, ItemCreate, ItemUpdate
from datetime import datetime

router = APIRouter(prefix="/items", tags=["items"])

# In-memory storage (replace with database in production)
items_db = []
item_id_counter = 1

@router.get("/", response_model=List[Item])
async def get_items():
    """Get all items"""
    return items_db

@router.get("/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get a specific item by ID"""
    for item in items_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@router.post("/", response_model=Item)
async def create_item(item: ItemCreate):
    """Create a new item"""
    global item_id_counter
    new_item = Item(
        id=item_id_counter,
        name=item.name,
        description=item.description,
        price=item.price,
        created_at=datetime.now()
    )
    items_db.append(new_item)
    item_id_counter += 1
    return new_item

@router.put("/{item_id}", response_model=Item)
async def update_item(item_id: int, item_update: ItemUpdate):
    """Update an existing item"""
    for i, item in enumerate(items_db):
        if item.id == item_id:
            updated_item = item.copy(update=item_update.dict(exclude_unset=True))
            items_db[i] = updated_item
            return updated_item
    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/{item_id}")
async def delete_item(item_id: int):
    """Delete an item"""
    for i, item in enumerate(items_db):
        if item.id == item_id:
            del items_db[i]
            return {"message": "Item deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")