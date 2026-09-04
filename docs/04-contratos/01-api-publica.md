# API pública

Estado: **normativo**

El paquete `@noeos/verifactu` expone una fachada creada con configuración inmutable y capacidades explícitas. No hay singletons ni configuración ambiental leída por el núcleo.

```ts
export interface Verifactu {
  readonly edition: EditionInfo;
  evaluateApplicability(input: ApplicabilityFacts): Result<ApplicabilityDecision>;
  prepareAlta(input: AltaInput): Promise<Result<PreparedRecord<"alta">>>;
  prepareAnulacion(input: AnulacionInput): Promise<Result<PreparedRecord<"anulacion">>>;
  prepareEvent(input: EventInput): Promise<Result<PreparedEvent>>;
  commit(prepared: PreparedArtifact, expectedHead: ChainHead): Promise<Result<CommittedArtifact>>;
  verifyRecord(input: VerifyRecordInput): Promise<Result<RecordVerification>>;
  verifyChain(input: VerifyChainInput): AsyncIterable<ChainVerificationItem>;
  buildQr(input: QrInput): Result<QrPayload>;
  verifyQr(input: VerifyQrInput): Result<QrVerification>;
  buildSubmission(input: BuildSubmissionInput): Promise<Result<Submission>>;
  inspectResponse(input: InspectResponseInput): Result<SubmissionResponse>;
  processQueue(input?: ProcessQueueInput): Promise<Result<ProcessReport>>;
  reconcile(input: ReconcileInput): Promise<Result<ReconciliationReport>>;
  export(input: ExportInput): AsyncIterable<Uint8Array>;
}

export function createVerifactu(config: VerifactuConfig): Result<Verifactu>;
export function getEdition(id?: EditionId): Result<EditionInfo>;
export function listCapabilities(): readonly Capability[];
```

Los tipos de registro son uniones discriminadas generadas de la edición, con tipos nominales para NIF, identidad, fecha AEAT, decimal, huella RRSIF, digest de evidencia y XML validado. `PreparedArtifact` no es persistible como confirmado; solo `commit` puede producir `CommittedArtifact` tras compare-and-swap del head y escritura atómica por los puertos.

## Familias de operación

- inspeccionar edición, capacidades y fuentes;
- evaluar aplicabilidad con hechos declarados;
- preparar/confirmar alta, anulación y evento;
- calcular y verificar huella, cadena, firma y QR;
- validar, serializar, parsear y exportar formatos oficiales;
- construir lotes e interpretar respuestas AEAT;
- ejecutar/reconciliar trabajo pendiente mediante puertos;
- verificar registros, secuencias y expedientes;
- obtener esquemas, catálogos y vectores publicados.

## Resultado y efectos

`Result<T>` es `{ ok: true; value: T; diagnostics: readonly Diagnostic[] } | { ok: false; error: VerifactuError; diagnostics: readonly Diagnostic[] }`. Aplicabilidad y verificaciones incorporan además resultado trivalente donde falta evidencia. Fallos esperables no lanzan excepciones; defectos de programación nunca se convierten en “válido”.

Reloj, almacenamiento, firma, certificados, transporte, entropía y evidencia se inyectan como puertos. Las entradas y salidas son inmutables y defensivas frente a getters, proxies, ciclos y buffers mutables. Cada operación admite `AbortSignal`; abortar no deja commit parcial.

Los nombres anteriores y su semántica se congelan en 1.0. Los campos mecánicos de `AltaInput`, `AnulacionInput` y `EventInput` se generan uno a uno desde la edición fijada y API Extractor impide drift accidental. No se exportan internals ni deep imports.
