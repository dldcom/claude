import io
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QLabel,
    QPushButton, QLineEdit, QScrollArea, QFileDialog, QMessageBox,
    QCheckBox, QSplitter, QFrame, QProgressBar, QSizePolicy
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QSize
from PyQt6.QtGui import QPixmap, QFont, QColor, QPalette

import fitz
from pdf_handler import load_pdf, render_page, render_page_large, extract_pages
from page_mapper import parse_page_input
from ocr_engine import scan_all_pages

# ── 색상 팔레트 ──────────────────────────────────────────
PINK     = "#FFB7C5"
LAVENDER = "#C9B8E8"
SOFT_BG  = "#FFF0F5"
WHITE    = "#FFFFFF"
TEXT     = "#5A4060"
BTN_HOVER = "#F9A8BE"

STYLE = f"""
QMainWindow, QWidget {{
    background-color: {SOFT_BG};
    color: {TEXT};
    font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
    font-size: 13px;
}}
QPushButton {{
    background-color: {PINK};
    color: {TEXT};
    border: none;
    border-radius: 12px;
    padding: 6px 16px;
    font-weight: bold;
}}
QPushButton:hover {{
    background-color: {BTN_HOVER};
}}
QPushButton:disabled {{
    background-color: #E0D0E8;
    color: #A090B0;
}}
QLineEdit {{
    background-color: {WHITE};
    border: 2px solid {LAVENDER};
    border-radius: 8px;
    padding: 4px 8px;
}}
QLineEdit:focus {{
    border-color: {PINK};
}}
QScrollArea {{
    background-color: {WHITE};
    border: 2px solid {LAVENDER};
    border-radius: 8px;
}}
QLabel#title {{
    font-size: 18px;
    font-weight: bold;
    color: {TEXT};
}}
QProgressBar {{
    border: 2px solid {LAVENDER};
    border-radius: 8px;
    background-color: {WHITE};
    text-align: center;
}}
QProgressBar::chunk {{
    background-color: {PINK};
    border-radius: 6px;
}}
"""


class ThumbnailWidget(QWidget):
    """체크박스 + 썸네일 + 페이지 번호를 담는 위젯"""
    clicked = pyqtSignal(int)  # pdf_index

    def __init__(self, pdf_index: int, parent=None):
        super().__init__(parent)
        self.pdf_index = pdf_index
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(2)

        self.check = QCheckBox()
        self.check.setStyleSheet(f"QCheckBox::indicator {{ width: 16px; height: 16px; }}")
        layout.addWidget(self.check, alignment=Qt.AlignmentFlag.AlignHCenter)

        self.img_label = QLabel()
        self.img_label.setFixedSize(150, 200)
        self.img_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.img_label.setStyleSheet(
            f"border: 2px solid {LAVENDER}; border-radius: 6px; background: {WHITE};"
        )
        self.img_label.setCursor(Qt.CursorShape.PointingHandCursor)
        layout.addWidget(self.img_label)

        self.page_label = QLabel("...")
        self.page_label.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        self.page_label.setStyleSheet(f"color: {TEXT}; font-size: 11px;")
        layout.addWidget(self.page_label)

    def set_pixmap(self, data: bytes):
        pm = QPixmap()
        pm.loadFromData(data)
        self.img_label.setPixmap(
            pm.scaled(150, 200, Qt.AspectRatioMode.KeepAspectRatio,
                      Qt.TransformationMode.SmoothTransformation)
        )

    def set_page_label(self, text: str):
        self.page_label.setText(text)

    def set_selected(self, selected: bool):
        color = PINK if selected else LAVENDER
        self.img_label.setStyleSheet(
            f"border: 2px solid {color}; border-radius: 6px; background: {WHITE};"
        )

    def mousePressEvent(self, event):
        self.clicked.emit(self.pdf_index)


class ThumbnailLoader(QThread):
    thumbnail_ready = pyqtSignal(int, bytes)   # (pdf_index, png_bytes)
    finished = pyqtSignal()

    def __init__(self, doc: fitz.Document):
        super().__init__()
        self.doc = doc
        self._stop = False

    def run(self):
        for i in range(self.doc.page_count):
            if self._stop:
                break
            data = render_page(self.doc, i, width=150)
            self.thumbnail_ready.emit(i, data)
        self.finished.emit()

    def stop(self):
        self._stop = True


class OcrWorker(QThread):
    progress = pyqtSignal(int, int)   # (current, total)
    finished = pyqtSignal(dict)       # {textbook_num: pdf_index}

    def __init__(self, doc: fitz.Document):
        super().__init__()
        self.doc = doc

    def run(self):
        # scan_all_pages는 이제 {pdf_index: textbook_num} 완성 맵을 반환
        pdf_to_textbook = scan_all_pages(
            self.doc,
            progress_callback=lambda c, t: self.progress.emit(c, t)
        )
        # {textbook_num: pdf_index} 역맵으로 변환
        page_map = {
            tb: pdf for pdf, tb in pdf_to_textbook.items()
            if tb is not None
        }
        self.finished.emit(page_map)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("🎀 PDF 추출기")
        self.resize(1100, 750)
        self.setStyleSheet(STYLE)

        self.doc = None
        self.page_map = {}           # {textbook_num: pdf_index}
        self.selected_indices = set()
        self.thumbnail_widgets = []
        self.loader = None
        self.ocr_worker = None
        self._filter_selected_only = False

        self._setup_ui()

    def _setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(16, 12, 16, 12)
        root.setSpacing(10)

        # ── 상단 바 ──
        top = QHBoxLayout()
        title = QLabel("🎀 PDF 추출기")
        title.setObjectName("title")
        top.addWidget(title)
        top.addStretch()
        self.open_btn = QPushButton("📂 파일 열기")
        self.open_btn.clicked.connect(self._open_file)
        top.addWidget(self.open_btn)
        root.addLayout(top)

        # ── 컨트롤 바 ──
        ctrl = QHBoxLayout()
        ctrl.addWidget(QLabel("페이지 입력:"))
        self.page_input = QLineEdit()
        self.page_input.setPlaceholderText("예: 1, 5-10, 15")
        self.page_input.setFixedWidth(200)
        self.page_input.textChanged.connect(self._on_page_input_changed)
        ctrl.addWidget(self.page_input)

        self.ocr_status_label = QLabel("")
        self.ocr_status_label.setStyleSheet(f"color: {TEXT}; font-size: 11px;")
        ctrl.addWidget(self.ocr_status_label)

        self.filter_btn = QPushButton("🔍 선택하기")
        self.filter_btn.setCheckable(True)
        self.filter_btn.setToolTip("선택된 페이지만 썸네일에 표시")
        self.filter_btn.toggled.connect(self._on_filter_toggled)
        ctrl.addWidget(self.filter_btn)

        ctrl.addStretch()
        root.addLayout(ctrl)

        # ── 진행바 (OCR용) ──
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        self.progress_bar.setFixedHeight(18)
        root.addWidget(self.progress_bar)

        # ── 메인 스플리터 ──
        splitter = QSplitter(Qt.Orientation.Horizontal)

        # 왼쪽: 썸네일 스크롤
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll.setMinimumWidth(200)
        thumb_container = QWidget()
        self.thumb_layout = QVBoxLayout(thumb_container)
        self.thumb_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.thumb_layout.setSpacing(6)
        self.scroll.setWidget(thumb_container)
        splitter.addWidget(self.scroll)

        # 오른쪽: 큰 미리보기
        right = QWidget()
        right_layout = QVBoxLayout(right)
        right_layout.setContentsMargins(8, 0, 0, 0)
        self.preview_label = QLabel("PDF 파일을 열어주세요 🎀")
        self.preview_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.preview_label.setStyleSheet(
            f"background: {WHITE}; border: 2px solid {LAVENDER}; border-radius: 8px;"
        )
        self.preview_label.setSizePolicy(
            QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding
        )
        right_layout.addWidget(self.preview_label)
        splitter.addWidget(right)

        splitter.setSizes([220, 880])
        root.addWidget(splitter, stretch=1)

        # ── 하단 바 ──
        bottom = QHBoxLayout()
        self.extract_btn = QPushButton("✨ 추출하기")
        self.extract_btn.setEnabled(False)
        self.extract_btn.clicked.connect(self._extract)
        bottom.addWidget(self.extract_btn)

        bottom.addWidget(QLabel("저장 경로:"))
        self.save_path_edit = QLineEdit()
        self.save_path_edit.setPlaceholderText("저장할 파일 경로...")
        bottom.addWidget(self.save_path_edit, stretch=1)
        browse_btn = QPushButton("...")
        browse_btn.setFixedWidth(36)
        browse_btn.clicked.connect(self._browse_save)
        bottom.addWidget(browse_btn)
        root.addLayout(bottom)

    # ── 파일 열기 ──────────────────────────────────────────

    def _open_file(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "PDF 파일 선택", "", "PDF 파일 (*.pdf)"
        )
        if not path:
            return

        if self.loader:
            self.loader.stop()
            self.loader.wait()

        try:
            if self.doc:
                self.doc.close()
            self.doc = load_pdf(path)
        except Exception as e:
            QMessageBox.critical(self, "오류", f"PDF를 열 수 없습니다:\n{e}")
            return

        self.setWindowTitle(f"🎀 PDF 추출기 — {path.split('/')[-1]}")
        self.page_map = {}
        self.selected_indices.clear()
        self._filter_selected_only = False
        self.filter_btn.setChecked(False)
        self._build_thumbnail_placeholders()
        self.extract_btn.setEnabled(True)
        self._start_thumbnail_loading()
        self._start_ocr()

    def _build_thumbnail_placeholders(self):
        # 기존 위젯 제거
        for w in self.thumbnail_widgets:
            self.thumb_layout.removeWidget(w)
            w.deleteLater()
        self.thumbnail_widgets.clear()

        for i in range(self.doc.page_count):
            w = ThumbnailWidget(i)
            w.page_label.setText(f"p.{i + 1}")
            w.check.stateChanged.connect(lambda state, idx=i: self._on_check_changed(idx, state))
            w.clicked.connect(self._show_large_preview)
            self.thumb_layout.addWidget(w)
            self.thumbnail_widgets.append(w)

    def _start_thumbnail_loading(self):
        self.loader = ThumbnailLoader(self.doc)
        self.loader.thumbnail_ready.connect(self._on_thumbnail_ready)
        self.loader.start()

    def _on_thumbnail_ready(self, pdf_index: int, data: bytes):
        if pdf_index < len(self.thumbnail_widgets):
            self.thumbnail_widgets[pdf_index].set_pixmap(data)

    # ── OCR ────────────────────────────────────────────────

    def _start_ocr(self):
        if not self.doc:
            return
        self.ocr_status_label.setText("🔍 페이지 번호 인식 중...")
        self.progress_bar.setVisible(True)
        self.progress_bar.setMaximum(self.doc.page_count)
        self.progress_bar.setValue(0)

        self.ocr_worker = OcrWorker(self.doc)
        self.ocr_worker.progress.connect(lambda c, t: self.progress_bar.setValue(c))
        self.ocr_worker.finished.connect(self._on_ocr_finished)
        self.ocr_worker.start()

    def _on_ocr_finished(self, page_map: dict):
        self.page_map = page_map
        self.progress_bar.setVisible(False)

        if not page_map:
            self.ocr_status_label.setText("⚠️ 페이지 번호 인식 실패 — 1부터 시작으로 표시")
        else:
            self.ocr_status_label.setText(f"✅ 페이지 번호 인식 완료")
            inv = {v: k for k, v in page_map.items()}
            for i, w in enumerate(self.thumbnail_widgets):
                if i in inv:
                    w.set_page_label(f"p.{inv[i]}")

    # ── 페이지 선택 ────────────────────────────────────────

    def _on_page_input_changed(self, text: str):
        """텍스트 입력 → 썸네일 하이라이트 + 체크박스 동기화"""
        try:
            textbook_pages = parse_page_input(text)
        except ValueError:
            self._set_input_error(True)
            return
        self._set_input_error(False)

        pdf_indices = self._textbook_to_pdf_indices(textbook_pages)
        self.selected_indices = set(pdf_indices)
        self._sync_checkboxes_from_selection()

    def _textbook_to_pdf_indices(self, textbook_pages: list[int]) -> list[int]:
        """교과서 번호 → PDF 인덱스 변환 (OCR 맵 또는 1-based 직접 매핑)"""
        if self.page_map:
            return [self.page_map[p] for p in textbook_pages if p in self.page_map]
        total = self.doc.page_count if self.doc else 0
        return [p - 1 for p in textbook_pages if 0 <= p - 1 < total]

    def _sync_checkboxes_from_selection(self):
        for i, w in enumerate(self.thumbnail_widgets):
            w.check.blockSignals(True)
            w.check.setChecked(i in self.selected_indices)
            w.check.blockSignals(False)
            w.set_selected(i in self.selected_indices)
        if self._filter_selected_only:
            self._apply_filter()

    def _on_filter_toggled(self, checked: bool):
        self._filter_selected_only = checked
        self.filter_btn.setText("📋 전체 보기" if checked else "🔍 선택하기")
        self._apply_filter()

    def _apply_filter(self):
        """필터 모드에 따라 썸네일 표시/숨김"""
        for i, w in enumerate(self.thumbnail_widgets):
            if self._filter_selected_only:
                w.setVisible(i in self.selected_indices)
            else:
                w.setVisible(True)

    def _on_check_changed(self, pdf_index: int, state: int):
        if state == Qt.CheckState.Checked.value:
            self.selected_indices.add(pdf_index)
        else:
            self.selected_indices.discard(pdf_index)
        self.thumbnail_widgets[pdf_index].set_selected(pdf_index in self.selected_indices)
        self._sync_input_from_selection()
        if self._filter_selected_only:
            self._apply_filter()

    def _sync_input_from_selection(self):
        """체크박스 변경 → 텍스트 입력란 업데이트"""
        if not self.selected_indices:
            self.page_input.blockSignals(True)
            self.page_input.setText("")
            self.page_input.blockSignals(False)
            return

        sorted_indices = sorted(self.selected_indices)
        inv_map = {v: k for k, v in self.page_map.items()} if self.page_map else {}

        def idx_to_label(idx):
            if inv_map:
                return str(inv_map.get(idx, idx + 1))
            return str(idx + 1)

        parts = [idx_to_label(i) for i in sorted_indices]
        self.page_input.blockSignals(True)
        self.page_input.setText(", ".join(parts))
        self.page_input.blockSignals(False)

    def _set_input_error(self, error: bool):
        style = f"border: 2px solid {'#FF6B8A' if error else '#C9B8E8'}; border-radius: 8px; padding: 4px 8px;"
        self.page_input.setStyleSheet(style)

    # ── 미리보기 ───────────────────────────────────────────

    def _show_large_preview(self, pdf_index: int):
        if not self.doc:
            return
        data = render_page_large(self.doc, pdf_index)
        pm = QPixmap()
        pm.loadFromData(data)
        self.preview_label.setPixmap(
            pm.scaled(
                self.preview_label.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation
            )
        )

    # ── 추출 ───────────────────────────────────────────────

    def _browse_save(self):
        path, _ = QFileDialog.getSaveFileName(
            self, "저장할 파일 선택", "extracted.pdf", "PDF 파일 (*.pdf)"
        )
        if path:
            self.save_path_edit.setText(path)

    def _extract(self):
        if not self.doc:
            return
        if not self.selected_indices:
            QMessageBox.warning(self, "알림", "추출할 페이지를 선택해주세요.")
            return
        output = self.save_path_edit.text().strip()
        if not output:
            output, _ = QFileDialog.getSaveFileName(
                self, "저장할 파일 선택", "extracted.pdf", "PDF 파일 (*.pdf)"
            )
            if not output:
                return
            self.save_path_edit.setText(output)

        indices = sorted(self.selected_indices)
        try:
            extract_pages(self.doc, indices, output)
            QMessageBox.information(
                self, "완료",
                f"✨ {len(indices)}페이지가 추출되었습니다!\n{output}"
            )
        except Exception as e:
            QMessageBox.critical(self, "오류", f"추출 실패:\n{e}")

    def closeEvent(self, event):
        if self.loader:
            self.loader.stop()
            self.loader.wait()
        if self.doc:
            self.doc.close()
        super().closeEvent(event)
