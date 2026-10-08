#!/usr/bin/env python3
"""Unprivileged ASAR builder. Called ONLY through auto_maintain.py's runuser step."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

from linux_installer import injected, patch_injector, sha256


def build(stage: Path) -> None:
    if os.geteuid() == 0:
        raise RuntimeError('Builder must never run as root')
    source = stage / 'ZCode/resources/app.asar'
    if not source.is_file() or injected(source):
        raise RuntimeError('Expected a pristine staged ZCode ASAR')
    old_digest = sha256(source)
    tools = stage / 'tool'
    tools.mkdir()
    upstream = Path(__file__).resolve().parent
    text = patch_injector((upstream / 'inject_tool.py').read_text(encoding='utf-8'))
    # Avoid collisions with the original macOS injector's hard-coded /tmp build dirs.
    for default, replacement in (
        ('Path("/tmp/zcode_inject_build")', 'Path(os.environ["ZCODE_PULLER_WORK_DIR"])'),
        ('Path("/tmp/zcode_repacked.asar")', 'Path(os.environ["ZCODE_PULLER_TEMP_ASAR"])'),
        ('Path("/tmp/zcode_syntax_probe")', 'Path(os.environ["ZCODE_PULLER_SYNTAX_DIR"])'),
        ('Path("/tmp/zcode_verify_extract")', 'Path(os.environ["ZCODE_PULLER_VERIFY_DIR"])'),
    ):
        if default not in text:
            raise RuntimeError('Upstream injector temp path changed; review compatibility first')
        text = text.replace(default, replacement)
    (tools / 'inject_tool.py').write_text(text, encoding='utf-8')
    shutil.copy2(upstream / 'zcode-model-puller.js', tools / 'zcode-model-puller.js')
    env = dict(os.environ)
    env.update({
        'ZCODE_PATH': str(stage / 'ZCode'),
        'ZCODE_PULLER_WORK_DIR': str(stage / 'build'),
        'ZCODE_PULLER_TEMP_ASAR': str(stage / 'repacked.asar'),
        'ZCODE_PULLER_SYNTAX_DIR': str(stage / 'syntax'),
        'ZCODE_PULLER_VERIFY_DIR': str(stage / 'verify'),
    })
    subprocess.run([sys.executable, str(tools / 'inject_tool.py')], check=True, env=env)
    if not injected(source) or sha256(source) == old_digest:
        raise RuntimeError('Injection output missing or unchanged')
    print('Verified unprivileged build complete', flush=True)


if __name__ == '__main__':
    build(Path(sys.argv[1]).resolve())