// ============================================================================
// FITUR AUTO-AI PRIVATE CHAT (DM) WHATSAPP - CANTARELLA - AI
// Provider: Pollinations AI (No API Key / Free)
// ============================================================================

if (_aiTriggerPv) {
    const _rawBody = String(body || '').trim();
    const _acPv = _ensureAI();
    const _cdKeyPv = 'pv:' + m.sender;
    const _lockKeyPv = 'pv:' + m.sender;
    const _nowPv = Date.now();
    const _cdLastPv = _acPv.cdMap[_cdKeyPv] || 0;
    const _lockTime = _acPv.locks[_lockKeyPv] || 0;

    if (_rawBody && (_nowPv - _cdLastPv) >= _AI_COOLDOWN_MS && (!_lockTime || (_nowPv - _lockTime) > 45000)) {
        _acPv.cdMap[_cdKeyPv] = _nowPv;
        _acPv.locks[_lockKeyPv] = _nowPv;

        (async function () {
            try {
                const _pvName = pushname || m.pushName || ('+' + String(m.sender || '').replace(/[^0-9]/g, ''));
                const _pvSess = _aiGetSess(m.chat, m.sender);
                if (!_pvSess.lang) {
                    _pvSess.lang = _aiDetectLang(m.sender);
                }

                const _pvIsOwner = _aiIsOwner(m.sender);
                if ((Date.now() - (_pvSess.lastReset || 0)) > _AI_SESSION_TTL && _pvSess.history.length > 0) {
                    _pvSess.history = [];
                    _pvSess.lastReset = Date.now();
                    _pvSess.msgCount = 0;
                }
                _pvSess.msgCount = (_pvSess.msgCount || 0) + 1;

                const _pvQCtx = _aiExtractQuotedCtx(m);
                let _pvQNote = '';
                if (_pvQCtx && _pvQCtx.text) {
                    if (_pvQCtx.from === 'bot') {
                        const _snippet = _pvQCtx.text.slice(0, 40);
                        const _pMatchIdx = _pvSess.history.findIndex(function (h) {
                            return h.role === 'assistant' && h.content.indexOf(_snippet) !== -1;
                        });
                        if (_pMatchIdx < 0) {
                            _pvSess.history.push({ role: 'assistant', content: _pvQCtx.text });
                        }
                    } else {
                        _pvQNote = '\n[Mengacu pada: "' + _pvQCtx.text.slice(0, 120) + '"]';
                    }
                }

                const _aiPvHr = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
                const _aiPvWkt = _aiPvHr >= 4 && _aiPvHr < 11 ? 'pagi' : (_aiPvHr >= 11 && _aiPvHr < 15 ? 'siang' : (_aiPvHr >= 15 && _aiPvHr < 18 ? 'sore' : 'malam'));

                const _rawPersona = typeof _AI_SYSTEM_PERSONA !== 'undefined' ? String(_AI_SYSTEM_PERSONA) : '';
                const _cleanPersona = _rawPersona.replace(/elaina|elaine/gi, 'Cantarella - Ai');

                const _pvOwnerNote = _pvIsOwner
                    ? '\n\nPERHATIAN: Lawan bicaramu (' + _pvName + ') adalah OWNER kamu. Sangat akrab, hangat, dan manja dikit ok.'
                    : '';

                const _pvSys =
                    'IDENTITAS WAJIB: Nama kamu adalah "Cantarella - Ai" (JANGAN PERNAH menyebut dirimu Elaina atau nama lain. Jika ditanya siapa namamu, jawab tegas bahwa namamu adalah Cantarella - Ai).\n\n' +
                    _cleanPersona +
                    '\n\n--- INSTRUKSI BAHASA ---\n' + _aiLangInstr(_pvSess.lang) +
                    '\n\n--- KONTEKS ---\nNama AI: Cantarella - Ai | Waktu: ' + _aiPvWkt + ' | DM privat | User: ' + _pvName + ' (pesan ke-' + _pvSess.msgCount + ')' +
                    _pvOwnerNote;

                const _userContent = _rawBody + _pvQNote;
                const _tempHistory = _pvSess.history.concat([{ role: 'user', content: _userContent }]).slice(-_AI_MAX_HISTORY);
                const _pvMessages = [{ role: 'system', content: _pvSys }].concat(_tempHistory);

                try {
                    await Cantarella.sendPresenceUpdate('composing', m.chat);
                } catch (_e1) {}

                const _endpoints = [
                    { url: 'https://text.pollinations.ai/', model: 'openai-fast' },
                    { url: 'https://text.pollinations.ai/openai', model: 'openai-fast' },
                    { url: 'https://text.pollinations.ai/', model: 'openai' }
                ];

                let _pvText = '';
                for (let _i = 0; _i < _endpoints.length; _i++) {
                    const _ep = _endpoints[_i];
                    try {
                        const _ctrl = new AbortController();
                        const _tId = setTimeout(function () { _ctrl.abort(); }, 35000);

                        const _res = await fetch(_ep.url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'Mozilla/5.0'
                            },
                            body: JSON.stringify({
                                model: _ep.model,
                                messages: _pvMessages,
                                private: true
                            }),
                            signal: _ctrl.signal
                        });
                        clearTimeout(_tId);

                        if (!_res.ok) {
                            throw new Error('HTTP ' + _res.status);
                        }

                        const _rawRes = await _res.text();
                        let _parsed = '';
                        try {
                            const _json = JSON.parse(_rawRes);
                            if (_json && _json.error) {
                                throw new Error(_json.error.message || 'API Error');
                            }
                            if (_json && _json.choices && _json.choices[0] && _json.choices[0].message) {
                                _parsed = _json.choices[0].message.content || '';
                            } else if (_json && _json.text) {
                                _parsed = _json.text;
                            }
                        } catch (_parseErr) {
                            if (_rawRes.trim().indexOf('{') === 0 && _rawRes.indexOf('"error"') !== -1) {
                                throw _parseErr;
                            }
                            _parsed = _rawRes;
                        }

                        _pvText = String(_parsed || '')
                            .replace(/\n*---\n*\*?Support Pollinations\.AI[\s\S]*$/i, '')
                            .replace(/\bElaina\b/gi, 'Cantarella - Ai')
                            .trim();

                        if (_pvText) {
                            break;
                        }
                    } catch (_modelErr) {
                        console.warn('[AIChat PV] gagal:', _modelErr && _modelErr.message ? _modelErr.message : _modelErr);
                    }
                }

                if (_pvText) {
                    _pvSess.history.push(
                        { role: 'user', content: _userContent },
                        { role: 'assistant', content: _pvText }
                    );
                    if (_pvSess.history.length > _AI_MAX_HISTORY) {
                        _pvSess.history = _pvSess.history.slice(-_AI_MAX_HISTORY);
                    }
                } else {
                    _pvText = 'Hmm gue blank sebentar ' + _pvName + ' 😅 Coba lagi~';
                }

                try {
                    await Cantarella.sendPresenceUpdate('paused', m.chat);
                } catch (_e2) {}

                await new Promise(function (r) {
                    setTimeout(r, Math.min(700 + _pvText.length * 13, 3500));
                });
                await Cantarella.sendMessage(m.chat, { text: _pvText }, { quoted: m });

            } catch (_pvErr) {
                console.error('[AIChat PV]', _pvErr && _pvErr.message ? _pvErr.message : _pvErr);
                try {
                    await Cantarella.sendPresenceUpdate('paused', m.chat);
                } catch (_e3) {}
            } finally {
                try {
                    delete _ensureAI().locks[_lockKeyPv];
                } catch (_e4) {}
                try {
                    _ensureAI().cdMap[_cdKeyPv] = Date.now();
                } catch (_e5) {}
            }
        })();
    }
}
