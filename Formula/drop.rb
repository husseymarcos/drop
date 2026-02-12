class Drop < Formula
  desc "Ephemeral high-performance server to share files over the local network"
  homepage "https://github.com/husseymarcos/drop"
  version "0.1.2"
  url "https://github.com/husseymarcos/drop/archive/refs/tags/v#{version}.tar.gz"
  sha256 "171fae8bf80bace114a8793e557d2366c494762a2c12b65bc83d886b6199ab65"
  license "MIT"
  head "https://github.com/husseymarcos/drop.git", branch: "main"

  depends_on "bun"

  def install
    system "bun", "install"
    system "bun", "build", "./index.ts", "--compile", "--outfile", "drop"
    bin.install "drop"
  end

  test do
    assert_match "file", shell_output("#{bin}/drop --help 2>&1")
  end
end
