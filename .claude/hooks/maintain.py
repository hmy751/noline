"""Project control entrypoint; optional external lifecycle dispatcher."""
from pathlib import Path
import runpy
import sys
project=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(project))
dispatch=project/'evidence-collector/integration/dispatch.py'
if dispatch.is_file():
    sys.path.insert(0,str(dispatch.parent))
    sys.argv=[str(dispatch),'--host','claude','--project-root',str(project),*sys.argv[1:]]
    runpy.run_path(str(dispatch),run_name='__main__')
else:
    if len(sys.argv)>1 and sys.argv[1] in ("tool-event", "interrupt"):
        raise SystemExit(0)
    from context.work.harness.maintain.claude_hook import main
    raise SystemExit(main(project_root=project))
