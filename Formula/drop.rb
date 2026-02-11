class Drop < Formula
  desc "Ephemeral high-performance server to share files over the local network"
  homepage "https://github.com/husseymarcos/drop"
  url "https://github.com/husseymarcos/drop/archive/refs/heads/main.tar.gz"
  sha256 "488409fb031b32e1d5569a17e6ca2d00e093edd4777ccfc238df33215ee36dc3"
  version "main"
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
