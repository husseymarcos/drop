class Drop < Formula
  desc "Ephemeral high-performance server to share files over the local network"
  homepage "https://github.com/husseymarcos/drop"
  version "0.1.0"
  url "https://github.com/husseymarcos/drop/archive/refs/tags/v#{version}.tar.gz"
  sha256 "db5bf290065cc7c6d9ff8b51d1e47bf40d7d2cbdd4fd0c68e765666ba2f70e47"
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
