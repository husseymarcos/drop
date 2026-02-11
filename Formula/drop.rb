class Drop < Formula
  desc "Ephemeral high-performance server to share files over the local network"
  homepage "https://github.com/husseymarcos/drop"
  version "0.1.1"
  url "https://github.com/husseymarcos/drop/archive/refs/tags/v#{version}.tar.gz"
  sha256 "62c63173c98cfca10c1955b0f5b58b99780478c37d6f2339dbeb4b8d0fb1c4eb"
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
