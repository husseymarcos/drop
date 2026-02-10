export const printHelp = (): void => {
  console.log(`
Drop - Ephemeral file sharing over LAN

Usage: drop -f <file> -t <time> [options]

Options:
  -f, --file <path>     Path to the file to share (required)
  -t, --time <duration> Time until the drop expires (required)
                        Formats: 5m, 1h, 90s, or seconds (300)
  -p, --port <number>   Port to run the server on (default: 8080)
  -h, --help            Show this help message

Examples:
  drop -f video.mp4 -t 5m
  drop -f backup.zip -t 1h -p 3000
  drop -f document.pdf -t 300
`);
};
