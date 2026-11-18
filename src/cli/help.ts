import packageJson from '../../package.json' with { type: 'json' };

export const HELP_TEXT = `
Drop - share a file over your Wi-Fi with a link and a QR code

Usage:
  drop <file|folder> [options]    Share a file (folders are sent as .tar)
  drop receive [options]          Open a page where others can upload to you

Options:
  -t, --time <duration>   How long the link works (default: 5m)
                          Formats: 90s, 5m, 1h, or seconds (300)
  -p, --port <number>     Port to listen on (default: 8080, or 80 with -a)
  -a, --alias <name>      Also publish <name>.local over mDNS
      --host <ip|iface>   Address to put in the link, e.g. 192.168.1.20 or en0
                          (use it when a VPN or second adapter is picked)
      --max-upload <size> Largest upload drop receive accepts (default: 1gb)
  -f, --file <path>       Same as passing the path directly
  -v, --version           Print the version
  -h, --help              Show this help

While running, press q or Ctrl-C to stop the link at once.

Examples:
  drop ./report.pdf
  drop ./photos -t 30m
  drop video.mp4 --host en0
  drop receive -t 10m --max-upload 2gb
`;

export const printHelp = (): void => {
  console.log(HELP_TEXT);
};

export const printVersion = (): void => {
  console.log(packageJson.version);
};
