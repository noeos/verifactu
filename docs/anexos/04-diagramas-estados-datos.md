# Diagramas de estados y datos

Estado: **normativo**

## Dependencias

```text
Facturación ──usa──> VERI*FACTU ──usa──> Verification Engine
     │                    │
     │                    ├── puerto de almacenamiento/firma/reloj
     │                    └── adapter AEAT
     └── canal B2B separado
```

## Expedición

```text
orden → validada → bytes oficiales → huella → firma si aplica
      → commit registro+cabeza+evento+outbox → QR/confirmación
```

## Remisión

```text
queued → submitting ─┬→ accepted
                    ├→ accepted-with-errors → correction-required
                    ├→ rejected → correction-required
                    ├→ retryable → queued
                    └→ indeterminate → reconcile
```

Las flechas son solo resumen. La tabla contractual de estados define precondiciones, efectos y evidencia y prevalece sobre el dibujo.
