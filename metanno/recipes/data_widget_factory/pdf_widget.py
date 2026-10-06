"""
PDF widget showing the document of the selected row with the browser viewer
"""

from typing import Any, Callable, Dict, Optional

from pret import DataFrame, component, server_only, use_store_snapshot
from pret.hooks import use_effect, use_ref, use_state
from pret.react import div, iframe
from pret.render import Renderable

from .widget_data import ErrorBanner, LoadingStatus, use_selected_rows


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
        Show the PDF of the lead selected row of a collection in the browser PDF viewer, eg beside a documents table.

        Parameters
        ----------
        store_key : Any
            Key of the collection or DataFrame whose selected row is shown
        primary_key : str
            Field identifying the rows, as in the table showing them
        loader : Callable[[Any], bytes]
            Called in Python with the selected row, returns the PDF bytes, eg read from a folder of downloaded files.
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
        selected_rows = self.selected_rows[store_key]
        data = self.data[store_key]
        on_mount = self.mount_dataframes if isinstance(data, DataFrame) else None
        if on_mount is not None:
            self.register_dataframe(store_key)
        load = server_only(loader)
        style = {"width": "100%", "height": "100%", **(style or {})}

        @component
        def PdfWidget():
            if on_mount is not None:
                use_effect(on_mount, [])
            identities = use_store_snapshot(selected_rows)["identities"]
            rows, view = use_selected_rows(data, primary_key, identities[:1])
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
            if error or view.error:
                return div(ErrorBanner(error=error or view.error), style=style)
            if row_id is None:
                return div("No document selected", style={**style, "padding": "1em", "boxSizing": "border-box"})
            if url is None:
                return div(LoadingStatus(label="Loading the PDF"), style=style)
            return iframe(src=url, title="PDF", style={**style, "border": 0})

        return PdfWidget()
