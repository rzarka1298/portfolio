import type { ProjectPage } from './types';

const x: ProjectPage = {
  slug: 'neuromaker',
  title: 'Speech-to-ASL Prosthetic Hand',
  tagline:
    'A NeuroMaker International Bioengineering Competition entry: a servo-driven prosthetic hand meant to turn spoken words into American Sign Language gestures.',
  status: 'Competition prototype · hardware',
  summary: [
    'The goal was a hand that listens and signs: record speech, convert it to text with Google Cloud Speech-to-Text, and move the hand’s fingers into the matching ASL handshapes.',
    'The software that survives is a set of small Python prototype scripts, one for each stage: record from the microphone, transcribe the recording with Google Cloud, and drive a hobby servo through an Arduino from Python. This page describes those stages as they were built. It does not claim a finished end-to-end translator.',
  ],
  problem: [
    'Most hearing people do not sign, and live interpreters are not always available. A device that turns speech into physical signs is a hands-on way to explore assistive translation for deaf and hard-of-hearing people.',
    'For a student competition, the hard parts are hardware and integration: reliable speech recognition, and mapping recognized words to finger positions that a few servos can actually reach.',
  ],
  highlights: [
    {
      title: 'Cloud speech recognition',
      body: 'The transcription script loads an audio file, sends it to Google Cloud Speech-to-Text (`en-US`, 44.1 kHz, automatic punctuation) using a service-account client, and reads each result’s transcript and confidence back out of the response.',
    },
    {
      title: 'Python-controlled servos via Firmata',
      body: 'Instead of separate firmware, the Arduino runs Firmata. Python (pyFirmata) puts a pin into SERVO mode and sweeps it one degree at a time with a 15 ms pause per step, giving the smooth, slow motion a finger joint needs.',
    },
    {
      title: 'Built stage by stage',
      body: 'Recording, transcription and actuation were each built and tested on their own. The servo test maps keyboard inputs (1, 2, 3) to different sweep ranges, standing in for the word-to-gesture lookup that would sit between the transcript and the hand.',
    },
  ],
  techStack: [
    { name: 'Python', role: 'All prototype scripts' },
    { name: 'PyAudio + wave', role: 'Microphone capture at 44.1 kHz, 16-bit mono' },
    { name: 'Google Cloud Speech-to-Text', role: 'Speech recognition with automatic punctuation' },
    { name: 'pyFirmata + Arduino', role: 'Servo control from Python over USB serial' },
    { name: 'Hobby servos', role: 'Actuate the prosthetic hand’s fingers' },
  ],
  architecture: {
    groups: [
      { id: 'capture', label: 'Speech capture' },
      { id: 'cloud', label: 'Recognition' },
      { id: 'actuate', label: 'Actuation' },
    ],
    nodes: [
      {
        id: 'mic',
        label: 'Microphone recorder',
        kind: 'client',
        x: 0,
        y: 0,
        group: 'capture',
        summary: 'PyAudio stream → WAV file until Ctrl-C.',
        details:
          'Opens a 44.1 kHz, 16-bit mono input stream, reads 1,024-frame buffers until interrupted, and writes them to a WAV file.',
        tech: ['PyAudio', 'wave'],
      },
      {
        id: 'audio',
        label: 'Audio file',
        kind: 'datastore',
        x: 280,
        y: 0,
        group: 'capture',
        summary: 'The recorded clip handed to recognition.',
        details: 'A short recorded utterance read as raw bytes by the transcription script.',
        tech: ['WAV / MP3'],
      },
      {
        id: 'stt',
        label: 'Transcription script',
        kind: 'service',
        x: 280,
        y: 160,
        group: 'cloud',
        summary: 'Sends audio to Google; extracts transcript and confidence.',
        details:
          'Builds a RecognitionAudio from the file bytes and a RecognitionConfig (44.1 kHz, en-US, automatic punctuation), calls `recognize`, and writes the response to a text file. It then pulls the transcript and confidence of each result out of that text.',
        tech: ['google-cloud-speech'],
      },
      {
        id: 'google',
        label: 'Google Cloud Speech-to-Text',
        kind: 'external',
        x: 560,
        y: 160,
        group: 'cloud',
        summary: 'Hosted speech recognition.',
        details: 'Authenticated with a service-account key file that is kept out of this page and any public material.',
        tech: ['Google Cloud'],
      },
      {
        id: 'servo-ctl',
        label: 'Servo controller',
        kind: 'worker',
        x: 280,
        y: 320,
        group: 'actuate',
        summary: 'pyFirmata script that sweeps a servo to set positions.',
        details:
          'Connects to the Arduino over USB serial, puts digital pin 3 in SERVO mode, and on each input sweeps the servo through a range of angles at one degree per 15 ms. This is where a word → handshape table would choose the positions.',
        tech: ['pyFirmata'],
      },
      {
        id: 'arduino',
        label: 'Arduino (Firmata)',
        kind: 'worker',
        x: 560,
        y: 320,
        group: 'actuate',
        summary: 'Generates the servo PWM on command.',
        details: 'Runs the standard Firmata firmware, so all control logic stays in Python on the host.',
        tech: ['Arduino', 'Firmata'],
      },
      {
        id: 'hand',
        label: 'Prosthetic hand',
        kind: 'worker',
        x: 840,
        y: 320,
        group: 'actuate',
        summary: 'Servo-actuated fingers that form handshapes.',
        details: 'The physical hand built for the competition. Servo angles set how far each finger bends.',
        tech: ['Servos', 'Mechanical linkages'],
      },
    ],
    edges: [
      { id: 'e-mic-audio', source: 'mic', target: 'audio', label: 'write WAV' },
      { id: 'e-stt-audio', source: 'stt', target: 'audio', label: 'read bytes' },
      { id: 'e-stt-google', source: 'stt', target: 'google', label: 'recognize(config, audio)' },
      { id: 'e-stt-servo', source: 'stt', target: 'servo-ctl', label: 'transcript → handshape (planned mapping)' },
      { id: 'e-servo-arduino', source: 'servo-ctl', target: 'arduino', label: 'Firmata over USB serial' },
      { id: 'e-arduino-hand', source: 'arduino', target: 'hand', label: 'servo PWM' },
    ],
    traces: [
      {
        id: 'speech-to-sign',
        name: 'From a spoken word to a moving finger',
        description: 'The intended flow through the prototype stages. The transcript-to-gesture link is the planned mapping, not a script found in the code.',
        steps: [
          {
            edgeId: 'e-mic-audio',
            title: 'Record speech',
            caption: 'The recorder captures microphone audio until it is stopped and saves it as a WAV file.',
          },
          {
            edgeId: 'e-stt-google',
            title: 'Transcribe',
            caption: 'The clip goes to Google Cloud Speech-to-Text, which returns the transcript with a confidence score.',
          },
          {
            edgeId: 'e-stt-servo',
            title: 'Choose a handshape',
            caption: 'Recognized words would select servo targets. In the prototype, keyboard inputs 1–3 stand in for this lookup.',
          },
          {
            edgeId: 'e-servo-arduino',
            title: 'Command the servo',
            caption: 'pyFirmata writes an angle to the servo pin one degree at a time, pausing 15 ms between steps.',
          },
          {
            edgeId: 'e-arduino-hand',
            title: 'Move the finger',
            caption: 'The Arduino drives the servo, which bends the finger into position.',
          },
        ],
      },
    ],
  },
  links: {},
};

export default x;
