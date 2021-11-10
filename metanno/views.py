class SpanEditor:
    nextId = 0

    def __init__(self, manager, name=None):
        self.manager = manager
        if name is not None:
            self.name = name
        else:
            self.name = f"span-editor-{self.nextId}"
            self.nextId += 1

    @property
    def state(self):
        return self.manager.app.state['editors'][self.name]

    def __getattr__(self, name):
        method = getattr(self.manager.app, name)

        def fn(*args, **kwargs):
            return method(self.name, *args, **kwargs)

        return fn

    def _repr_mimebundle_(self, **kwargs):
        plaintext = repr(self)
        if len(plaintext) > 110:
            plaintext = plaintext[:110] + '…'
        data = {'text/plain': plaintext, 'application/vnd.jupyter.annotator+json': {
            'version_major': 0,
            'version_minor': 0,
            'editor-type': 'span-editor',
            'editor-id': self.name
        }}
        # The 'application/vnd.jupyter.widget-view+json' mimetype has not been registered yet.
        # See the registration process and naming convention at
        # http://tools.ietf.org/html/rfc6838
        # and the currently registered mimetypes at
        # http://www.iana.org/assignments/media-types/media-types.xhtml.
        return data


class TableEditor:
    nextId = 0

    def __init__(self, manager, name=None):
        self.manager = manager
        if name is not None:
            self.name = name
        else:
            self.name = f"table-editor-{self.nextId}"
            self.nextId += 1

    @property
    def state(self):
        return self.manager.app.state['editors'][self.name]

    def __getattr__(self, name):
        method = getattr(self.manager.app, name)

        def fn(*args, **kwargs):
            return method(self.name, *args, **kwargs)

        return fn

    def _repr_mimebundle_(self, **kwargs):
        plaintext = repr(self)
        if len(plaintext) > 110:
            plaintext = plaintext[:110] + '…'
        data = {'text/plain': plaintext, 'application/vnd.jupyter.annotator+json': {
            'version_major': 0,
            'version_minor': 0,
            'editor-type': 'table-editor',
            'editor-id': self.name
        }}
        # The 'application/vnd.jupyter.widget-view+json' mimetype has not been registered yet.
        # See the registration process and naming convention at
        # http://tools.ietf.org/html/rfc6838
        # and the currently registered mimetypes at
        # http://www.iana.org/assignments/media-types/media-types.xhtml.
        return data
