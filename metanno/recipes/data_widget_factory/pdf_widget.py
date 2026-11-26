"""
PDF widget showing the document of the selected row with the browser viewer
"""

from typing import Any, Callable, Dict, Optional

from pret import component, server_only, use_store_snapshot
from pret.hooks import use_effect, use_ref, use_state
from pret.react import div, iframe
from pret.render import Renderable

from .widget_data import VIEW_STATUS, StatusStack, use_selected_rows, use_widget_statuses


class PdfWidgets:
    def create_pdf_widget(
        self,
        *,
        store_key: Any,
        primary_key: str,
        loader: Callable[[Any], bytes],
        style: Optional[Dict[str, Any]] = None,
    ) -> Renderable:
        """
        Show the PDF of the lead selected row of a collection in the browser PDF viewer, e.g. beside a documents table.

        Parameters
        ----------
        store_key : Any
            Key of the collection or DataFrame whose selected row is shown
        primary_key : str
            Field identifying the rows, as in the table showing them
        loader : Callable[[Any], bytes]
            Called in Python with the selected row, returns the PDF bytes, e.g. read from a folder of downloaded files.
            Other formats, such as scans or DOCX files, can be converted to PDF there.
        style : Dict[str, Any] | None
            Inline style of the container, which fills its parent unless these keys override it

        Returns
        -------
        Renderable
            A Pret component showing the PDF, or a loading, empty or error message
        """
        store_key = str(store_key)
        self.ensure_selected_rows(store_key)
        self.lead_row_keys[store_key] = True
        selected_rows = self.selected_rows[store_key]
        data = self.data[store_key]
        on_mount = self.register_widget_dataframe(store_key)
        load = server_only(loader)
        style = {"width": "100%", "height": "100%", **(style or {})}
        status = VIEW_STATUS.get()

        @component
        def PdfWidget():
            if on_mount is not None:
                use_effect(on_mount, [])
            selected = use_store_snapshot(selected_rows)
            rows, view = use_selected_rows(data, primary_key, selected["identities"][:1], None, selected)
            row_id = rows[0][primary_key] if len(rows) else None
            url, set_url = use_state(None)
            error, set_error = use_state(None)
            current = use_ref(None)

            async def fetch_pdf(row):
                try:
                    content = await load(row)
                    # A later selection may have replaced this row while its bytes were loading
                    if current.current == row[primary_key]:
                        set_url(URL.createObjectURL(__new__(Blob([content], {"type": "application/pdf"}))))  # noqa: F821
                except BaseException as reason:
                    set_error(str(reason))

            def load_selected():
                current.current = row_id
                set_url(None)
                set_error(None)
                if row_id is not None:
                    fetch_pdf(rows[0])

            def revoke():
                # Release the blob of the previous document once its frame is replaced
                return lambda: URL.revokeObjectURL(url) if url else None  # noqa: F821

            use_effect(load_selected, [row_id])
            use_effect(revoke, [url])
            loading = row_id is not None and url is None and not error
            statuses = use_widget_statuses(status, view.error, "Loading the PDF" if loading else view.loading, error)
            return div(
                iframe(src=url, title="PDF", style={"width": "100%", "height": "100%", "border": 0})
                if url
                else div(
                    "No document selected" if row_id is None and not view.loading else None, style={"padding": "1em"}
                ),
                StatusStack(statuses=statuses, corner="top-right"),
                style={**style, "position": "relative"},
            )

        return PdfWidget()
