// edge-tts.js — Microsoft Edge TTS (免费，无需 API Key)
// 通过 WebSocket 连接微软语音服务，每月免费 50 万字符
(function(PR) {
  'use strict';

  // 精选中文语音列表
  PR.edgeVoices = [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (女, 温暖)', gender: 'Female' },
    { id: 'zh-CN-YunxiNeural', name: '云希 (男, 新闻)', gender: 'Male' },
    { id: 'zh-CN-YunjianNeural', name: '云健 (男, 运动)', gender: 'Male' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (女, 温柔)', gender: 'Female' },
    { id: 'zh-CN-YunyangNeural', name: '云扬 (男, 沉稳)', gender: 'Male' },
    { id: 'zh-CN-YunxiaNeural', name: '云夏 (男, 活泼)', gender: 'Male' },
    { id: 'zh-CN-XiaochenNeural', name: '晓辰 (女, 自然)', gender: 'Female' },
    { id: 'zh-CN-XiaohanNeural', name: '晓涵 (女, 甜美)', gender: 'Female' },
    { id: 'zh-CN-XiaomengNeural', name: '晓梦 (女, 柔和)', gender: 'Female' },
    { id: 'zh-CN-XiaomoNeural', name: '晓墨 (女, 知性)', gender: 'Female' },
    { id: 'zh-CN-XiaoqiuNeural', name: '晓秋 (女, 成熟)', gender: 'Female' },
    { id: 'zh-CN-XiaoruiNeural', name: '晓睿 (女, 青春)', gender: 'Female' },
    { id: 'zh-CN-XiaoshuangNeural', name: '晓双 (女, 童声)', gender: 'Female' },
    { id: 'zh-CN-XiaoxuanNeural', name: '晓萱 (女, 自信)', gender: 'Female' },
    { id: 'zh-CN-XiaoyanNeural', name: '晓颜 (女, 优雅)', gender: 'Female' },
    { id: 'zh-CN-XiaozhenNeural', name: '晓臻 (女, 沉稳)', gender: 'Female' },
    { id: 'zh-CN-YunfengNeural', name: '云枫 (男, 成熟)', gender: 'Male' },
    { id: 'zh-CN-YunhaoNeural', name: '云皓 (男, 青年)', gender: 'Male' },
    { id: 'zh-CN-YunyeNeural', name: '云野 (男, 沉稳)', gender: 'Male' },
    { id: 'zh-CN-YunzeNeural', name: '云泽 (男, 温柔)', gender: 'Male' },
    // 粤语
    { id: 'zh-HK-HiuMaanNeural', name: '曉曼 (粵語, 女)', gender: 'Female' },
    { id: 'zh-HK-WanLungNeural', name: '雲龍 (粵語, 男)', gender: 'Male' },
    { id: 'zh-HK-HiuGaaiNeural', name: '曉佳 (粵語, 女)', gender: 'Female' },
    // 台湾国语
    { id: 'zh-TW-HsiaoChenNeural', name: '曉臻 (台灣, 女)', gender: 'Female' },
    { id: 'zh-TW-YunJheNeural', name: '雲哲 (台灣, 男)', gender: 'Male' },
    { id: 'zh-TW-HsiaoYuNeural', name: '曉雨 (台灣, 女)', gender: 'Female' }
  ];

  // UUID 生成器
  PR._uuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // XML 转义
  PR._escapeXml = function(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  };

  // 二进制帧中查找 \r\n\r\n 分隔符
  PR._findHeaderEnd = function(data) {
    for (var i = 0; i < data.length - 3; i++) {
      if (data[i] === 13 && data[i+1] === 10 && data[i+2] === 13 && data[i+3] === 10) {
        return i + 4;
      }
    }
    return -1;
  };

  PR.fetchEdgeAudio = async function(text) {
    var cfg = PR.loadAiConfig();
    var voiceId = cfg.edgeVoice || 'zh-CN-XiaoxiaoNeural';
    var rate = PR.getSpeed();

    return new Promise(function(resolve, reject) {
      var ws;
      try {
        ws = new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud');
      } catch(e) {
        reject(new Error('Edge TTS: 不支持 WebSocket'));
        return;
      }

      var audioChunks = [];
      var resolved = false;

      var cleanup = function() {
        if (!resolved) {
          resolved = true;
          try { ws.close(); } catch(e) {}
        }
      };

      ws.onopen = function() {
        // 发送配置消息
        var configPayload = JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: false,
                  wordBoundaryEnabled: false
                },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        });

        ws.send(
          'X-RequestId:' + PR._uuid() + '\r\n' +
          'Content-Type:application/json; charset=utf-8\r\n' +
          '\r\n' +
          'Path: speech.config\r\n' +
          '\r\n' +
          configPayload
        );

        // 发送 SSML
        var ssml =
          '<speak xmlns="http://www.w3.org/2001/10/synthesis" ' +
          'xmlns:mstts="http://www.w3.org/2001/mstts" ' +
          'xml:lang="' + (voiceId.startsWith('zh-HK') ? 'zh-HK' : voiceId.startsWith('zh-TW') ? 'zh-TW' : 'zh-CN') + '" ' +
          'version="1.0">' +
          '<voice name="' + voiceId + '">' +
          '<prosody rate="' + rate.toFixed(1) + '">' +
          PR._escapeXml(text) +
          '</prosody></voice></speak>';

        ws.send(
          'X-RequestId:' + PR._uuid() + '\r\n' +
          'Content-Type:application/ssml+xml\r\n' +
          '\r\n' +
          'Path: ssml\r\n' +
          '\r\n' +
          ssml
        );
      };

      ws.onmessage = function(evt) {
        if (typeof evt.data === 'string') {
          // 文本消息 — turn.start / turn.end
          if (evt.data.indexOf('Path:turn.end') >= 0) {
            setTimeout(function() { ws.close(); }, 100);
          }
          return;
        }

        // 二进制消息 — 提取音频
        var data = new Uint8Array(evt.data);
        var headerEnd = PR._findHeaderEnd(data);
        if (headerEnd > 0 && headerEnd < data.length) {
          audioChunks.push(data.slice(headerEnd));
        }
      };

      ws.onclose = function() {
        if (!resolved) {
          resolved = true;
          if (audioChunks.length > 0) {
            var blob = new Blob(audioChunks, { type: 'audio/mpeg' });
            resolve(blob);
          } else {
            reject(new Error('Edge TTS: 未收到音频'));
          }
        }
      };

      ws.onerror = function() {
        cleanup();
        reject(new Error('Edge TTS: 连接失败，请检查网络'));
      };

      // 30 秒超时
      setTimeout(function() {
        if (!resolved) {
          cleanup();
          reject(new Error('Edge TTS: 请求超时'));
        }
      }, 30000);
    });
  };

})(window.PR);
