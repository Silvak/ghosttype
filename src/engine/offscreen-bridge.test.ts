import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome APIs before importing the module under test
const mockHasDocument = vi.fn();
const mockCreateDocument = vi.fn();
const mockSendMessage = vi.fn();
const mockAddListener = vi.fn();
const mockRemoveListener = vi.fn();
const mockGetURL = vi.fn((path: string) => `chrome-extension://abc123/${path}`);

(globalThis as unknown as Record<string, unknown>).chrome = {
  offscreen: {
    hasDocument: mockHasDocument,
    createDocument: mockCreateDocument,
  },
  runtime: {
    getURL: mockGetURL,
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
    },
  },
};

import { sendToOffscreen, downloadViaOffscreen } from './offscreen-bridge.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockHasDocument.mockResolvedValue(false);
  mockCreateDocument.mockResolvedValue(undefined);
});

describe('offscreen-bridge — sendToOffscreen()', () => {
  it('creates the offscreen document if not present', async () => {
    mockHasDocument.mockResolvedValue(false);
    mockSendMessage.mockResolvedValue({ ok: true, suggestion: 'result' });

    await sendToOffscreen({ type: 'offscreen:rewrite', modelId: 't5', prompt: 'test', maxTokens: 100 });

    expect(mockCreateDocument).toHaveBeenCalledOnce();
    expect(mockCreateDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'chrome-extension://abc123/offscreen.html',
        reasons: expect.arrayContaining(['WORKERS']),
      }),
    );
  });

  it('skips createDocument when offscreen already exists', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ ok: true });

    await sendToOffscreen({ type: 'offscreen:remove', modelId: 'x', repo: 'r' });

    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  it('merges target: offscreen into the message', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ ok: true });

    await sendToOffscreen({ type: 'offscreen:remove', modelId: 'x', repo: 'r' });

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ target: 'offscreen', type: 'offscreen:remove' }),
    );
  });

  it('returns the offscreen document response', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ ok: true, suggestion: 'rewritten text' });

    const result = await sendToOffscreen<string>({ type: 'offscreen:rewrite' });

    expect(result).toEqual({ ok: true, suggestion: 'rewritten text' });
  });
});

describe('offscreen-bridge — downloadViaOffscreen()', () => {
  it('registers and removes a progress listener during download', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ ok: true });

    const onProgress = vi.fn();
    await downloadViaOffscreen('t5-small-q8', 'Xenova/t5-small', 'q8', onProgress);

    expect(mockAddListener).toHaveBeenCalledOnce();
    expect(mockRemoveListener).toHaveBeenCalledOnce();
  });

  it('resolves when offscreen responds ok: true', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ ok: true });

    await expect(
      downloadViaOffscreen('t5-small-q8', 'Xenova/t5-small', 'q8', vi.fn()),
    ).resolves.toBeUndefined();
  });

  it('rejects when offscreen responds ok: false', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockResolvedValue({ ok: false, error: 'Network failure' });

    await expect(
      downloadViaOffscreen('t5-small-q8', 'Xenova/t5-small', 'q8', vi.fn()),
    ).rejects.toThrow('Network failure');
  });

  it('rejects when sendMessage throws', async () => {
    mockHasDocument.mockResolvedValue(true);
    mockSendMessage.mockRejectedValue(new Error('Extension context invalidated'));

    await expect(
      downloadViaOffscreen('t5-small-q8', 'Xenova/t5-small', 'q8', vi.fn()),
    ).rejects.toThrow('Extension context invalidated');

    expect(mockRemoveListener).toHaveBeenCalledOnce();
  });
});
