// Background Service Worker (Manifest V3)

// 브라우저 툴바 액션 클릭 시 자동으로 사이드 패널이 열리도록 설정
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

// 구형 크롬 버전 호환성을 위한 클릭 리스너 폴백
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (err) {
      console.warn('Side panel open error:', err);
    }
  }
});
