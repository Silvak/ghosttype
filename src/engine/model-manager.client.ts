import type { ModelListEntry, ModelManagerRequest, ModelManagerResponse, ModelProgressMessage } from '../types/index.js';

export type { ModelListEntry } from '../types/index.js';

export type ProgressCallback = (modelId: string, progress: number) => void;

function isModelProgressMessage(msg: unknown): msg is ModelProgressMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as ModelProgressMessage).type === 'model:progress' &&
    typeof (msg as ModelProgressMessage).modelId === 'string' &&
    typeof (msg as ModelProgressMessage).progress === 'number'
  );
}

async function sendModelMessage(req: ModelManagerRequest): Promise<ModelManagerResponse> {
  try {
    const res = (await chrome.runtime.sendMessage(req)) as ModelManagerResponse | undefined;
    if (res === undefined) {
      const le = chrome.runtime.lastError?.message;
      throw new Error(
        le
          ? `No se pudo hablar con el motor de la extensión: ${le}`
          : 'No se pudo hablar con el motor de la extensión. Recarga GhostType en chrome://extensions.',
      );
    }
    return res;
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    if (
      m.includes('Receiving end does not exist') ||
      m.includes('Could not establish connection') ||
      m.includes('message port closed')
    ) {
      throw new Error(
        'El proceso en segundo plano no responde. Abre chrome://extensions y pulsa «Recargar» en GhostType.',
      );
    }
    throw err instanceof Error ? err : new Error(m);
  }
}

export async function list(): Promise<ModelListEntry[]> {
  const res = await sendModelMessage({ type: 'model:list' });

  if (res.ok !== true || !Array.isArray(res.models)) {
    const err = res.ok === false ? res.error : 'Invalid response from background';
    throw new Error(err);
  }
  return res.models;
}

export async function download(id: string, onProgress?: ProgressCallback): Promise<void> {
  const progressHandler = (msg: unknown) => {
    if (isModelProgressMessage(msg) && msg.modelId === id) {
      onProgress?.(id, msg.progress);
    }
  };

  chrome.runtime.onMessage.addListener(progressHandler);

  try {
    const res = await sendModelMessage({
      type: 'model:download',
      modelId: id,
    });

    if (res.ok !== true) {
      const err = res.ok === false ? res.error : 'Download failed';
      throw new Error(err);
    }
  } finally {
    chrome.runtime.onMessage.removeListener(progressHandler);
  }
}

export async function remove(id: string): Promise<void> {
  const res = await sendModelMessage({
    type: 'model:remove',
    modelId: id,
  });

  if (res.ok !== true) {
    const err = res.ok === false ? res.error : 'Remove failed';
    throw new Error(err);
  }
}

export async function setActive(id: string): Promise<void> {
  const res = await sendModelMessage({
    type: 'model:setActive',
    modelId: id,
  });

  if (res.ok !== true) {
    const err = res.ok === false ? res.error : 'Activate failed';
    throw new Error(err);
  }
}
