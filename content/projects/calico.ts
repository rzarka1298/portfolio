import type { ProjectPage } from './types';

const x: ProjectPage = {
  slug: 'calico',
  title: 'Calico Smartlabs',
  tagline:
    'A miniature wearable robot that relocates across the body on an on-cloth track. This version adds an ESP32-S3 with a round touchscreen and IMU, driven from a browser over Wi-Fi.',
  status: 'Research lab project · ACM IMWUT (2022)',
  summary: [
    'Calico comes from the University of Maryland Small Artifacts Lab. The IMWUT paper (Sathya, Li, Rahman, Gao, Peng; Vol. 6 No. 3, 2022) describes a small, self-contained two-wheel robot that rides an on-cloth track, called a “railway”, and can reach predetermined spots on the body. Rotating “turntable” switches route it where tracks branch.',
    'The public onBodyRobot repository holds the lab’s later software for the robot: Arduino firmware for a Seeed XIAO ESP32-S3 with a 240×240 round touch display, an ICM-20948 IMU, a NeoPixel and two motors on an MCP23017 expander, plus a Flask server that hosts a Blockly programming interface and relays commands to the robot over Wi-Fi.',
    'This page describes the system as the paper and repository show it. It is a team project, and it does not try to say which person built which part.',
  ],
  problem: [
    'Wearables are usually fixed in one place on the body. A device that can move between locations could, for example, check posture in one spot and act as a walkie-talkie or a coach in another. The paper argues that earlier relocatable wearables were either too bulky or depended on slow, unreliable ways of moving.',
    'Software is a second barrier: getting a robot like this to do anything has meant flashing firmware and editing code. The repository’s Blockly interface and packaged installer are aimed at letting people program movement, lights and on-screen images without touching C++.',
  ],
  highlights: [
    {
      title: 'Track-based locomotion (paper)',
      body: 'Instead of crawling over fabric, Calico rides a track sewn into clothing, which the paper credits for fast, reliable and precise movement. Applications explored include remote chest auscultation, posture tracking, a wearable walkie-talkie, an on-body companion, and a user study of Calico as a dance trainer.',
    },
    {
      title: 'Blocks become robot commands',
      body: 'The Blockly page turns a program into text lines such as `moveForward(1000)`. Simple `if` blocks are evaluated in the browser, each line is scheduled using its duration, and each one is sent to the local Flask server as `GET /execute/<command>`.',
    },
    {
      title: 'Line-based TCP protocol on the robot',
      body: 'The server opens a TCP connection to the ESP32 on port 3333 and sends one newline-terminated command. Motor and LED commands are fire-and-forget. Commands starting with `GET_` or `CHECK_` wait up to 1.5 s for a reply, such as the current LED color. A move blocks the firmware loop until it finishes, so commands run one at a time.',
    },
    {
      title: 'Display that stays level',
      body: 'Every 150 ms the firmware reads the IMU accelerometer, computes a roll angle, and redraws the current PNG rotated by the opposite angle when it has changed by more than 5°, so the picture stays upright as the robot moves. Swipes on the touchscreen step through the images stored in SPIFFS.',
    },
    {
      title: 'Pictures over Wi-Fi',
      body: 'PNGs uploaded in the browser are saved by the Flask server and forwarded to an AsyncWebServer endpoint on the ESP32, which appends them to SPIFFS and shows the new image. The files survive reboots until SPIFFS is cleared.',
    },
    {
      title: 'Installer for people who don’t code',
      body: 'A Tkinter installer and launcher (macOS and Windows) write the Wi-Fi credentials into the sketch, compile and flash it with arduino-cli, read the robot’s IP from the serial port, and then start the Flask server and open the browser. The repo describes this as a prototype for packaging, not the main implementation.',
    },
  ],
  techStack: [
    { name: 'Seeed XIAO ESP32-S3 (Arduino C++)', role: 'Robot firmware: Wi-Fi TCP command server, motors, IMU, display, LED' },
    { name: 'TFT_eSPI + PNGdec + LVGL touch helpers', role: 'GC9A01 240×240 round display, PNG streaming from SPIFFS, CHSC6X touch' },
    { name: 'ICM-20948 IMU', role: 'Accelerometer roll angle for display rotation; live IMU screen in v5' },
    { name: 'MCP23017 I/O expander', role: 'Direction pins for two motors (port B0–B3)' },
    { name: 'ESPAsyncWebServer + SPIFFS', role: 'On-robot image upload endpoint and persistent image storage' },
    { name: 'Python · Flask', role: 'Hosts the Blockly UI; relays commands over TCP and image uploads over HTTP' },
    { name: 'Blockly / BlocklyDuino', role: 'Visual programming interface with custom motor and LED blocks' },
    { name: 'Tkinter + arduino-cli + pyserial', role: 'Packaged installer and launcher prototype' },
    { name: 'OpenCV + Pillow', role: '`convert_frames.py`: video → 240×240 PNG frames sized for SPIFFS' },
  ],
  architecture: {
    groups: [
      { id: 'host', label: 'Laptop / browser' },
      { id: 'robot', label: 'Calico robot (ESP32-S3)' },
      { id: 'hw', label: 'On-board hardware' },
      { id: 'tools', label: 'Setup tooling' },
    ],
    nodes: [
      {
        id: 'blockly',
        label: 'Blockly programming UI',
        kind: 'ui',
        x: 0,
        y: 160,
        group: 'host',
        summary: 'Browser page with custom motor and LED blocks.',
        details:
          'Generated code is split into lines. `if` headers are evaluated in the page against block variables. Each remaining command is scheduled with setTimeout using the running total of earlier durations and sent to `/execute/<command>`. Images are uploaded from the options menu.',
        tech: ['Blockly', 'BlocklyDuino', 'JavaScript'],
        codePath: 'osu-v4/data/index.html',
      },
      {
        id: 'server',
        label: 'Flask relay server',
        kind: 'service',
        x: 280,
        y: 160,
        group: 'host',
        summary: 'Serves the UI on :5001 and forwards commands and images to the robot.',
        details:
          '`/execute/<command>` opens a TCP socket to ESP32_IP:3333 (1.5 s timeout) and sends the command followed by a newline. It only waits for a reply for GET_/CHECK_ queries. `/upload_image` accepts PNG files only, saves them under pics/, and re-posts them to the robot’s HTTP endpoint. The robot IP comes from the ESP32_IP environment variable.',
        tech: ['Python', 'Flask', 'flask-cors', 'requests', 'socket'],
        codePath: 'osu-v4/server.py',
      },
      {
        id: 'firmware',
        label: 'Robot firmware main loop',
        kind: 'service',
        x: 560,
        y: 80,
        group: 'robot',
        summary: 'TCP command server on :3333 plus a touch, IMU and motor loop.',
        details:
          'Each pass of the loop applies any pending LED command, advances a small touch state machine (idle → touching → released → gesture processed), re-levels the display every 150 ms, and serves one TCP client line by line.\n\nCommands: `moveForward(ms)`, `moveBackward(ms)` (default 5 s), `stopMotor`, `setRed/Green/Blue` and `GET_LED_COLOR`.',
        tech: ['Arduino C++', 'ESP32 WiFi', 'FastLED'],
        codePath: 'osu-v4/osu-v4.ino',
      },
      {
        id: 'upload',
        label: 'Image upload endpoint',
        kind: 'service',
        x: 560,
        y: 320,
        group: 'robot',
        summary: 'AsyncWebServer POST /upload_image on port 80.',
        details:
          'Streams each uploaded chunk into a SPIFFS file. When the upload finishes it sets a flag, so the main loop rescans SPIFFS and shows the new image.',
        tech: ['ESPAsyncWebServer'],
        codePath: 'osu-v4/osu-v4.ino',
      },
      {
        id: 'spiffs',
        label: 'SPIFFS image store',
        kind: 'datastore',
        x: 840,
        y: 320,
        group: 'robot',
        summary: 'On-flash PNGs that persist across reboots.',
        details:
          'Holds the user’s uploaded pictures (v4) or numbered animation frames under /anim/ (v5). PNGs are decoded straight from flash with PNGdec. Capacity is about 1.4 MB, which `convert_frames.py` stays within.',
        tech: ['SPIFFS', 'PNGdec'],
      },
      {
        id: 'motors',
        label: 'Drive motors',
        kind: 'worker',
        x: 840,
        y: 0,
        group: 'hw',
        summary: 'Two motors switched through an MCP23017 on I2C (0x20).',
        details:
          'Forward, backward and stop set the IN1/IN2 pins of both motors on expander port B0–B3. A move runs for its duration and then stops. In the paper’s design, these wheels move the robot along the on-cloth track.',
        tech: ['MCP23017', 'Adafruit_MCP23X17', 'I2C'],
      },
      {
        id: 'imu',
        label: 'ICM-20948 IMU',
        kind: 'worker',
        x: 840,
        y: 160,
        group: 'hw',
        summary: 'Accelerometer → roll angle for orientation.',
        details:
          'Roll is computed as atan2(accY, accZ) and mapped to 0–360°. The v5 sketches add a screen that shows live accelerometer, gyro and magnetometer readings with roll and pitch at 10 Hz.',
        tech: ['SparkFun ICM-20948', 'I2C'],
      },
      {
        id: 'display',
        label: 'Round touch display',
        kind: 'ui',
        x: 1120,
        y: 80,
        group: 'hw',
        summary: '240×240 GC9A01 screen with CHSC6X touch.',
        details:
          'Shows the current image rotated to cancel the measured tilt. A horizontal swipe past 30 px moves to the next or previous image. The v5 sketches add GO/STOP buttons, a procedurally drawn heartbeat animation and the IMU data screen.',
        tech: ['TFT_eSPI', 'GC9A01', 'CHSC6X'],
      },
      {
        id: 'installer',
        label: 'Installer + launcher',
        kind: 'client',
        x: 0,
        y: 400,
        group: 'tools',
        summary: 'Tkinter apps that flash the robot and start the server.',
        details:
          'The installer checks for Arduino tooling, installs the bundled libraries, writes the Wi-Fi SSID and password into the sketch, compiles and uploads it with arduino-cli, detects the ESP32 serial port, waits for the robot to print its IP and saves it to a config file. The launcher starts the Flask server with ESP32_IP set and opens the browser.',
        tech: ['Python', 'Tkinter', 'arduino-cli', 'pyserial'],
        codePath: 'app-installer/macOS/Calico_Installer.py',
      },
      {
        id: 'frames',
        label: 'Frame converter',
        kind: 'client',
        x: 280,
        y: 400,
        group: 'tools',
        summary: 'Video → 240×240 PNG frames for the v5 animation.',
        details:
          'Extracts frames at a target FPS, center-crops and resizes them to the round screen, and stops once the total size would exceed the SPIFFS budget. The frames are uploaded to /anim/ with the Arduino data-upload tool.',
        tech: ['Python', 'OpenCV', 'Pillow'],
        codePath: 'osu-v5/robot-control/convert_frames.py',
      },
    ],
    edges: [
      { id: 'e-ui-server', source: 'blockly', target: 'server', label: 'GET /execute/<cmd> · POST /upload_image' },
      { id: 'e-server-fw', source: 'server', target: 'firmware', label: 'Wi-Fi TCP :3333, one line per command' },
      { id: 'e-server-upload', source: 'server', target: 'upload', label: 'HTTP POST /upload_image (PNG)' },
      { id: 'e-upload-spiffs', source: 'upload', target: 'spiffs', label: 'append chunks' },
      { id: 'e-fw-spiffs', source: 'firmware', target: 'spiffs', label: 'scan files · PNGdec stream' },
      { id: 'e-fw-motors', source: 'firmware', target: 'motors', label: 'IN1/IN2 via MCP23017' },
      { id: 'e-imu-fw', source: 'imu', target: 'firmware', label: 'roll angle' },
      { id: 'e-fw-display', source: 'firmware', target: 'display', label: 'rotated frame · read touch' },
      { id: 'e-installer-fw', source: 'installer', target: 'firmware', label: 'arduino-cli compile + upload' },
      { id: 'e-installer-server', source: 'installer', target: 'server', label: 'launch with ESP32_IP' },
      { id: 'e-frames-spiffs', source: 'frames', target: 'spiffs', label: '/anim/frame_NNN.png' },
    ],
    traces: [
      {
        id: 'block-to-motion',
        name: 'A block program moves the robot',
        description: 'A user drags a “move forward 1000 ms” block and presses run.',
        steps: [
          {
            nodeId: 'blockly',
            title: 'Generate and schedule',
            caption: 'Blockly emits `moveForward(1000)`. The page parses the duration and schedules each command after the ones before it have had time to finish.',
          },
          {
            edgeId: 'e-ui-server',
            title: 'Call the local server',
            caption: 'The browser requests `/execute/moveForward(1000)` from the Flask server on port 5001.',
          },
          {
            edgeId: 'e-server-fw',
            title: 'Relay over Wi-Fi',
            caption: 'The server opens a TCP socket to the robot on port 3333, sends the line, and returns “OK” without waiting, because this is not a query.',
          },
          {
            edgeId: 'e-fw-motors',
            title: 'Drive, then stop',
            caption: 'The firmware sets both motors forward through the MCP23017, holds for 1000 ms, then clears the pins. The loop is blocked while it waits, so the next command is handled only after this one.',
          },
          {
            edgeId: 'e-server-fw',
            reverse: true,
            title: 'Query state',
            caption: 'A “check LED color” block sends GET_LED_COLOR. This time the server waits up to 1.5 s for the robot’s hex reply and passes it back to the page.',
          },
        ],
      },
      {
        id: 'picture-upload',
        name: 'A picture appears on the robot',
        description: 'Uploading a PNG from the browser until it shows, level, on the round screen.',
        steps: [
          {
            edgeId: 'e-ui-server',
            title: 'Upload a PNG',
            caption: 'The options menu posts the file to `/upload_image`. The server rejects anything that is not a .png and saves a local copy.',
          },
          {
            edgeId: 'e-server-upload',
            title: 'Forward to the robot',
            caption: 'The server re-posts the file to the ESP32’s AsyncWebServer endpoint on port 80.',
          },
          {
            edgeId: 'e-upload-spiffs',
            title: 'Persist to flash',
            caption: 'Chunks are appended to a SPIFFS file. On the final chunk a flag tells the main loop a new image arrived.',
          },
          {
            edgeId: 'e-fw-spiffs',
            title: 'Rescan and decode',
            caption: 'The loop rescans SPIFFS, resets the image index and decodes the PNG straight from flash.',
          },
          {
            edgeId: 'e-imu-fw',
            title: 'Measure tilt',
            caption: 'Every 150 ms the IMU roll angle is read. If it has changed by more than 5°, the frame is redrawn.',
          },
          {
            edgeId: 'e-fw-display',
            title: 'Draw it level',
            caption: 'Each screen pixel is inverse-rotated into the source image, so the picture stays upright as the robot tilts. Swipes then page through the stored images.',
          },
        ],
      },
    ],
  },
  install: {
    intro: 'From the repository README. Arduino IDE (or arduino-cli) with the bundled libraries, plus Python for the relay server.',
    steps: [
      { label: 'Install Arduino libraries', code: 'unzip libraries.zip  # copy the folders into your Arduino libraries directory' },
      { label: 'Flash the firmware', code: '# set your Wi-Fi in osu-v4/osu-v4.ino, then upload it to the XIAO ESP32-S3' },
      { label: 'Install server dependencies', code: 'cd osu-v4 && pip install -r requirements.txt' },
      { label: 'Run the server', code: 'ESP32_IP=<robot-ip> python server.py  # then open http://127.0.0.1:5001' },
    ],
  },
  links: {
    github: 'https://github.com/jsli96/onBodyRobot',
    docs: 'https://arxiv.org/abs/2208.08491',
    live: 'https://smartlab.cs.umd.edu/publication/calico',
  },
};

export default x;
