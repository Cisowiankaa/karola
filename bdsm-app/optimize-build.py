from pathlib import Path
import re

root = Path('bdsm-app')
index = root / 'index.html'
text = index.read_text(encoding='utf-8')

patterns = [
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/sync-fix-v3\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/invite-status-central\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/email-panel-force-open\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/offences-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/deadlines-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/education-tasks-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/education-library-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/written-notes-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/relationship-timeline-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/timeline-ui-v2\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/case-controls-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/today-dashboard-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/weekly-plan-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/weekly-carryover-v2\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/month-calendar-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/day-agenda-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/day-agenda-groups-v2\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/agenda-cloud-sync-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/daily-reports-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/hourly-reports-module\.js[^\"]*"[^>]*></script>',
    r'\n?<script[^>]+src="https://cdn\.jsdelivr\.net/gh/Cisowiankaa/karola@[^\"]+/bdsm-app/cloud-status-module\.js[^\"]*"[^>]*></script>',
]
for pattern in patterns:
    text = re.sub(pattern, '', text)

for start, end in [
    ('<!-- BDSM_RUNTIME_INLINE_START -->', '<!-- BDSM_RUNTIME_INLINE_END -->'),
    ('<!-- BDSM_SAFETY_TOPBAR_START -->', '<!-- BDSM_SAFETY_TOPBAR_END -->'),
    ('<!-- BDSM_EMAIL_HISTORY_V4_START -->', '<!-- BDSM_EMAIL_HISTORY_V4_END -->'),
]:
    if start in text and end in text:
        a = text.index(start)
        b = text.index(end, a) + len(end)
        text = text[:a] + text[b:]

sync = (root / 'sync-fix-v3.js').read_text(encoding='utf-8')
sync_queue_guard = (root / 'sync-queue-guard.js').read_text(encoding='utf-8')
history = (root / 'invite-status-central.js').read_text(encoding='utf-8')
email_panel = (root / 'email-panel-force-open.js').read_text(encoding='utf-8')
offences = (root / 'offences-module.js').read_text(encoding='utf-8')
deadlines = (root / 'deadlines-module.js').read_text(encoding='utf-8')
education = (root / 'education-tasks-module.js').read_text(encoding='utf-8')
education_library = (root / 'education-library-module.js').read_text(encoding='utf-8')
written_notes = (root / 'written-notes-module.js').read_text(encoding='utf-8')
timeline = (root / 'relationship-timeline-module.js').read_text(encoding='utf-8')
timeline_ui_v2 = (root / 'timeline-ui-v2.js').read_text(encoding='utf-8')
case_controls = (root / 'case-controls-module.js').read_text(encoding='utf-8')
today_dashboard = (root / 'today-dashboard-module.js').read_text(encoding='utf-8')
weekly_plan = (root / 'weekly-plan-module.js').read_text(encoding='utf-8')
weekly_carryover_v2 = (root / 'weekly-carryover-v2.js').read_text(encoding='utf-8')
month_calendar = (root / 'month-calendar-module.js').read_text(encoding='utf-8')
day_agenda = (root / 'day-agenda-module.js').read_text(encoding='utf-8')
day_agenda_groups_v2 = (root / 'day-agenda-groups-v2.js').read_text(encoding='utf-8')
agenda_cloud = (root / 'agenda-cloud-sync-module.js').read_text(encoding='utf-8')
daily_reports = (root / 'daily-reports-module.js').read_text(encoding='utf-8')
hourly_reports = (root / 'hourly-reports-module.js').read_text(encoding='utf-8')
cloud_status = (root / 'cloud-status-module.js').read_text(encoding='utf-8')

safety = r'''<!-- BDSM_SAFETY_TOPBAR_START -->
<style>
.sidebar .safety{display:none!important}
#safetyTopBtn{border:1px solid #313b4f;background:#0e1420;color:#fff;border-radius:12px;padding:9px 12px;cursor:pointer;font-weight:700;margin-right:10px}
#safetyPopover{position:fixed;top:78px;right:24px;width:min(380px,calc(100vw - 32px));z-index:9999;background:#111724;border:1px solid #394258;border-radius:14px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.45);display:none}
#safetyPopover.open{display:block}
#safetyPopover h3{margin:0 0 12px;color:#ff63bb;font-size:16px}
#safetyPopover p{margin:8px 0;color:#d4d9e4;font-size:13px;line-height:1.45}
#safetyPopover .panic{position:static;margin-top:14px;width:100%}
@media(max-width:900px){#safetyPopover{top:66px;right:16px}#safetyTopBtn{padding:8px 10px;font-size:12px}}
</style>
<script>
(()=>{
  if(window.__bdsmSafetyTopbarInstalled)return;
  window.__bdsmSafetyTopbarInstalled=true;
  const install=()=>{
    const old=document.querySelector('.sidebar .safety');
    const top=document.querySelector('.topbar');
    if(!old||!top||document.querySelector('#safetyTopBtn'))return;
    const btn=document.createElement('button');
    btn.id='safetyTopBtn';btn.type='button';btn.innerHTML='🛡️ Bezpieczeństwo';
    const pop=document.createElement('div');
    pop.id='safetyPopover';
    pop.innerHTML='<h3>Bezpieczeństwo przede wszystkim</h3><p>✓ Zgoda i granice są podstawą.</p><p>✓ Każdy wpis można anulować.</p><p>✓ System nie zaostrza automatycznie konsekwencji.</p>';
    const panic=old.querySelector('#panic');
    if(panic)pop.appendChild(panic);
    const chips=top.querySelector('.chips');
    if(chips)chips.insertAdjacentElement('beforebegin',btn);else top.appendChild(btn);
    document.body.appendChild(pop);
    btn.addEventListener('click',e=>{e.stopPropagation();pop.classList.toggle('open')});
    pop.addEventListener('click',e=>e.stopPropagation());
    document.addEventListener('click',()=>pop.classList.remove('open'));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')pop.classList.remove('open')});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
</script>
<!-- BDSM_SAFETY_TOPBAR_END -->'''

mods = [sync_queue_guard, sync, history, email_panel, offences, deadlines, education, education_library, written_notes, timeline, timeline_ui_v2, case_controls, today_dashboard, weekly_plan, weekly_carryover_v2, month_calendar, day_agenda, day_agenda_groups_v2, agenda_cloud, daily_reports, hourly_reports, cloud_status]
runtime = '<!-- BDSM_RUNTIME_INLINE_START -->\n' + ''.join(f'<script>\n{x}\n</script>\n' for x in mods) + '<!-- BDSM_RUNTIME_INLINE_END -->'

block = '\n' + runtime + '\n' + safety + '\n'
text = text.replace('</body>', block + '</body>')
index.write_text(text, encoding='utf-8')
print('Optimized BDSM index: sync + timeline v2 + weekly carryover + grouped day agenda + reports + cloud status + safety')
# build trigger: grouped day agenda v2
