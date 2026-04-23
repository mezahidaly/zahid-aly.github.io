const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const localSignal = document.getElementById('localSignal');
const remoteSignal = document.getElementById('remoteSignal');
const applyRemoteBtn = document.getElementById('applyRemote');
const statusEl = document.getElementById('status');
const copyLocalBtn = document.getElementById('copyLocal');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const receivedEl = document.getElementById('received');
const clearBtn = document.getElementById('clearBtn');

let pc = null;
let channel = null;
let role = null;

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function setStatus(message, connected = false) {
  statusEl.textContent = message;
  statusEl.className = connected ? 'status connected' : 'status';
}

function resetConnection() {
  if (channel) {
    channel.onopen = null;
    channel.onclose = null;
    channel.onmessage = null;
    channel.close();
  }

  if (pc) {
    pc.onicecandidate = null;
    pc.ondatachannel = null;
    pc.close();
  }

  pc = null;
  channel = null;
  sendBtn.disabled = true;
  localSignal.value = '';
  remoteSignal.value = '';
  setStatus('Not connected');
}

function setupPeerConnection() {
  pc = new RTCPeerConnection(rtcConfig);

  pc.onicecandidate = () => {
    if (pc.iceGatheringState === 'complete') {
      localSignal.value = JSON.stringify(pc.localDescription);
    }
  };

  pc.onicegatheringstatechange = () => {
    if (pc.iceGatheringState === 'complete' && pc.localDescription) {
      localSignal.value = JSON.stringify(pc.localDescription);
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      setStatus('Connected ✓', true);
      sendBtn.disabled = false;
    } else if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
      setStatus(`Connection ${pc.connectionState}`);
      sendBtn.disabled = true;
    }
  };
}

function attachChannelHandlers(dataChannel) {
  channel = dataChannel;
  channel.onopen = () => {
    setStatus('Data channel open ✓', true);
    sendBtn.disabled = false;
  };

  channel.onclose = () => {
    setStatus('Data channel closed');
    sendBtn.disabled = true;
  };

  channel.onmessage = (event) => {
    const current = receivedEl.textContent === 'No data yet.' ? '' : receivedEl.textContent + '\n\n';
    receivedEl.textContent = `${current}${new Date().toLocaleTimeString()}\n${event.data}`;
  };
}

hostBtn.addEventListener('click', async () => {
  resetConnection();
  role = 'host';
  setupPeerConnection();

  const dataChannel = pc.createDataChannel('tuni-data');
  attachChannelHandlers(dataChannel);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  setStatus('Host offer created. Copy and send your payload.');
});

joinBtn.addEventListener('click', () => {
  resetConnection();
  role = 'guest';
  setupPeerConnection();
  pc.ondatachannel = (event) => attachChannelHandlers(event.channel);
  setStatus('Guest ready. Paste host payload and click Apply.');
});

applyRemoteBtn.addEventListener('click', async () => {
  if (!pc || !role) {
    setStatus('Create or join a session first.');
    return;
  }

  const payload = remoteSignal.value.trim();
  if (!payload) {
    setStatus('Paste a signaling payload first.');
    return;
  }

  let desc;
  try {
    desc = JSON.parse(payload);
  } catch {
    setStatus('Invalid payload. Must be valid JSON.');
    return;
  }

  try {
    await pc.setRemoteDescription(desc);

    if (role === 'guest' && desc.type === 'offer') {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setStatus('Answer created. Copy your payload back to host.');
    } else if (role === 'host' && desc.type === 'answer') {
      setStatus('Answer applied. Waiting for connection...');
    } else {
      setStatus(`Unexpected payload type '${desc.type}' for ${role}.`);
    }
  } catch (error) {
    setStatus(`Could not apply payload: ${error.message}`);
  }
});

copyLocalBtn.addEventListener('click', async () => {
  if (!localSignal.value.trim()) {
    setStatus('No local payload to copy yet.');
    return;
  }

  try {
    await navigator.clipboard.writeText(localSignal.value);
    setStatus('Payload copied to clipboard.');
  } catch {
    setStatus('Clipboard blocked. Copy manually instead.');
  }
});

sendBtn.addEventListener('click', () => {
  const message = messageInput.value;
  if (!message.trim()) {
    setStatus('Type some data before sending.');
    return;
  }

  if (!channel || channel.readyState !== 'open') {
    setStatus('Channel is not open.');
    return;
  }

  channel.send(message);
  setStatus('Data sent ✓', true);
});

clearBtn.addEventListener('click', () => {
  receivedEl.textContent = 'No data yet.';
});
