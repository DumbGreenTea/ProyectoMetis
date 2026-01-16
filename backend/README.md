# Metis Backend API

Backend API para el proyecto Metis construido con FastAPI.

## Requisitos

- Python 3.8+
- Virtual environment (ya configurado en `.venv`)

## Instalación

1. Activar el entorno virtual:
   ```bash
   source .venv/bin/activate
   ```

2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

## Ejecutar la aplicación

```bash
python main.py
```

O usando uvicorn directamente:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Documentación de la API

Una vez que la aplicación esté ejecutándose, puedes acceder a:

- **API Docs (Swagger UI)**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Endpoints disponibles

### Health Check
- `GET /health` - Verificar estado de la API

### Items
- `GET /items` - Obtener todos los items
- `GET /items/{item_id}` - Obtener un item específico
- `POST /items` - Crear un nuevo item
- `PUT /items/{item_id}` - Actualizar un item
- `DELETE /items/{item_id}` - Eliminar un item

## Estructura del proyecto

```
backend/
├── main.py              # Aplicación principal
├── requirements.txt     # Dependencias
├── models/              # Modelos de datos
│   └── item.py
├── routers/             # Rutas de la API
│   └── items.py
└── .venv/               # Entorno virtual
```

## Próximos pasos

- Agregar base de datos (PostgreSQL, MongoDB, etc.)
- Implementar autenticación JWT
- Agregar validaciones adicionales
- Configurar logging
- Agregar tests unitarios