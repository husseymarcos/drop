# Drop

**Drag, Drop & Destroy** — Servidor efímero de alto rendimiento para compartir archivos por red local.

## El problema: la fricción del "mandamelo"

Compartir un archivo pesado (video, instalador, dump de base de datos) entre dos computadoras en la misma habitación es más difícil de lo que debería:

- **Nube (Drive/Dropbox):** Subir a internet y volver a bajar. Desperdicio de ancho de banda y limitado por tu velocidad de subida.
- **Mensajería (WhatsApp/Slack):** Comprime, tiene límites de tamaño y ensucia tus chats.
- **Pendrives:** Es 2026; nadie quiere buscar cable o puerto USB.

## La solución: Drop

Drop convierte tu computadora en un nodo de transferencia instantáneo **solo en tu red local**.

| Ventaja | Descripción |
|--------|-------------|
| **Velocidad LAN** | La transferencia solo está limitada por tu tarjeta de red y router (1 Gbps+). No sale a internet. |
| **URL efímera** | Al "soltar" el archivo, Drop genera un link local (ej: `http://192.168.1.15:8080/vuelo-402`). |
| **Autodestrucción** | Cuando el destinatario termina de descargar, el servidor cierra y los datos se borran de RAM, sin rastro. |

## Requisitos

- [Bun](https://bun.sh) (runtime recomendado).

## Instalación

```bash
bun install
```

## Uso (CLI)

Compartir un archivo en la red local con tiempo de expiración:

```bash
drop -f <archivo> -t <tiempo>
```

| Flag | Descripción |
|------|-------------|
| `-f`, `--file` | Ruta del archivo a compartir. |
| `-t`, `--time` | Tiempo hasta que expire el drop (ej: `5m`, `1h`, `300` segundos). |

**Ejemplo:**

```bash
bun run index.ts -f ./video.mp4 -t 10m
```

El servidor arranca, genera una URL local (ej: `http://192.168.1.15:8080/abc123`) y, al expirar el tiempo o tras la descarga, se cierra y borra los datos.
