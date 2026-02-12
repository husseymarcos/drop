class Drop < Formula
  desc "Ephemeral high-performance server to share files over the local network"
  homepage "https://github.com/husseymarcos/drop"
  version "0.1.3"
  url "https://github.com/husseymarcos/drop/archive/refs/tags/v#{version}.tar.gz"
  sha256 "a194b04324d3b02cfd296fabf066e9e0065ce8467072a0b98ed16b01f4baef2f"
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
