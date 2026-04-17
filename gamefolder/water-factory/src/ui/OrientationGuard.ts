export function mountOrientationGuard(): void {
  const guard = document.createElement('div');
  guard.id = 'orientation-guard';
  guard.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: #1a1a2a; color: #fff;
    display: none;
    flex-direction: column; align-items: center; justify-content: center;
    font-family: sans-serif; text-align: center; padding: 40px;
  `;
  guard.innerHTML = `
    <div style="font-size: 72px; margin-bottom: 20px;">📱 ↻</div>
    <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">가로로 돌려주세요</div>
    <div style="font-size: 18px; color: #bbb;">이 게임은 가로 모드에서만 즐길 수 있어요.</div>
  `;
  document.body.appendChild(guard);

  const evaluate = () => {
    const portrait = window.innerHeight > window.innerWidth;
    guard.style.display = portrait ? 'flex' : 'none';
  };
  evaluate();
  window.addEventListener('resize', evaluate);
  window.addEventListener('orientationchange', evaluate);
}
