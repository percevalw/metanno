"""
Delay selected replies for the closing view regression
"""

from pathlib import Path

from ipykernel.kernelapp import IPKernelApp
from tornado.ioloop import IOLoop

import metanno.viewer.explorer_kernel as kernel


class FixtureKernel(kernel.DataExplorerKernel):
    """
    Delay source opening replies so the browser can replace a view before its reply arrives
    """

    def send_response(self, comm, request_id, method, data):
        """
        Deliver delayed openings and record live views for the browser cleanup assertion
        """
        if method == "open_table_view" and Path("hold-open.txt").exists():
            # The browser replaces this view before releasing its reply and checks that it is closed
            Path("pending-open.txt").write_text(data["view_ref"])
            IOLoop.current().call_later(0.1, self.send_response, comm, request_id, method, data)
        else:
            super().send_response(comm, request_id, method, data)
        Path("views-count.txt").write_text(str(len(self.views)))


IPKernelApp.launch_instance(kernel_class=FixtureKernel if Path("delay-replies").exists() else kernel.DataExplorerKernel)
