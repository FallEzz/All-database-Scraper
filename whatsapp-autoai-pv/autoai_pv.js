// ============================================================================
// SOLUSI 1 (PALING DIREKOMENDASIKAN):
// Cari fungsi `async function groqChat(...)` di script bot kamu, lalu TIMPA
// dengan fungsi `groqChat` di bawah ini.
// Dengan cara ini, SEMUA fitur AI (Grup, Private Chat, maupun Command AI)
// otomatis pindah ke Pollinations AI (TANPA API KEY) dan bernama Cantarella - Ai!
// ============================================================================

async function groqChat(prompt, opts) {
    opts = opts || {};
    var rawMessages = Array.isArray(opts.messages) && opts.messages.length
        ? opts.messages
        : [{ role: 'user', content: String(prompt || '') }];

    var messages = rawMessages.map(function (m) {
        var c = String(m.content || '').replace(/elaina|elaine|ᴇʟᴀɪɴ[ᴇᴀ]/gi, 'Cantarella - Ai');
        if (m.role === 'system') {
            c = 'IDENTITAS WAJIB: Nama kamu adalah "Cantarella - Ai" (JANGAN PERNAH menyebut dirimu Elaina atau nama lain. Jika ditanya siapa namamu, jawab tegas bahwa namamu adalah Cantarella - Ai).\n\n' + c;
        }
        return { role: m.role || 'user', content: c };
    });

    var endpoints = [
        { url: 'https://text.pollinations.ai/', model: 'openai-fast' },
        { url: 'https://text.pollinations.ai/openai', model: 'openai-fast' }
    ];

    for (var i = 0; i < endpoints.length; i++) {
        try {
            var ctrl = new AbortController();
            var tId = setTimeout(function () { ctrl.abort(); }, 25000);
            var res = await fetch(endpoints[i].url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify({
                    model: endpoints[i].model,
                    messages: messages,
                    private: true
                }),
                signal: ctrl.signal
            });
            clearTimeout(tId);
            if (!res.ok) continue;

            var txt = await res.text();
            var reply = txt;
            try {
                var j = JSON.parse(txt);
                if (j && j.error) continue;
                reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || j.text || txt;
            } catch (e) {}

            reply = String(reply || '')
                .replace(/\n*---\n*\*?Support Pollinations\.AI[\s\S]*$/i, '')
                .replace(/\bElaina\b/gi, 'Cantarella - Ai')
                .trim();

            if (reply) return reply;
        } catch (e) {}
    }

    try {
        var sysMsg = messages.find(function (m) { return m.role === 'system'; });
        var sysText = sysMsg ? sysMsg.content.slice(0, 600) : 'Nama kamu adalah Cantarella - Ai.';
        var userText = String(prompt || (messages[messages.length - 1] && messages[messages.length - 1].content) || 'Halo');
        var getUrl = 'https://text.pollinations.ai/' + encodeURIComponent(userText) + '?model=openai-fast&system=' + encodeURIComponent(sysText);
        var resGet = await fetch(getUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (resGet.ok) {
            var txtGet = (await resGet.text())
                .replace(/\n*---\n*\*?Support Pollinations\.AI[\s\S]*$/i, '')
                .replace(/\bElaina\b/gi, 'Cantarella - Ai')
                .trim();
            if (txtGet) return txtGet;
        }
    } catch (e) {}

    return '';
}


// ============================================================================
// SOLUSI 2: BLOK `if (_aiTriggerPv)` UNTUK PRIVATE CHAT
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
                    { url: 'https://text.pollinations.ai/openai', model: 'openai-fast' }
                ];

                let _pvText = '';
                for (let _i = 0; _i < _endpoints.length; _i++) {
                    const _ep = _endpoints[_i];
                    try {
                        const _ctrl = new AbortController();
                        const _tId = setTimeout(function () { _ctrl.abort(); }, 25000);

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
                    } catch (_modelErr) {}
                }

                if (!_pvText) {
                    try {
                        const _getUrl = 'https://text.pollinations.ai/' + encodeURIComponent(_rawBody) + '?model=openai-fast&system=' + encodeURIComponent(_pvSys.slice(0, 600));
                        const _resGet = await fetch(_getUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                        if (_resGet.ok) {
                            _pvText = (await _resGet.text())
                                .replace(/\n*---\n*\*?Support Pollinations\.AI[\s\S]*$/i, '')
                                .replace(/\bElaina\b/gi, 'Cantarella - Ai')
                                .trim();
                        }
                    } catch (_getErr) {}
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
