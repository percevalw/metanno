# Installation

Metanno runs in JupyterLab 3 or 4, with Python 3.10 or later. For a first try, install it in the Python environment
that runs JupyterLab:

```bash { data-md-color-scheme="slate" }
pip install metanno
python -m metanno.viewer.explorer_kernel --install
```

The second command registers the `metanno-explorer` kernel, which reads your databases for the Metanno sidebar.
Refresh JupyterLab: the Metanno icon appears in the left sidebar, and you can start with
[Annotate a table](tutorials/annotate-a-table.md).

## In a project

To keep Metanno with the other dependencies of your project, add it to your `pyproject.toml` or
`requirements.txt`, then install them in a new environment:

=== "pyproject.toml"

    ```toml
    [project]
    name = "my-annotation-project"
    version = "0.1.0"
    requires-python = ">=3.10"
    dependencies = [
      "metanno>=2.0.0-beta.5",
      "edsnlp>=0.21",  # used to pre-annotate the documents
    ]
    ```

    ```bash { data-md-color-scheme="slate" }
    mamba create -n annotation python=3.11 -y
    mamba activate annotation
    pip install .
    ```

=== "requirements.txt"

    ```text
    metanno>=2.0.0-beta.5
    edsnlp>=0.21  # used to pre-annotate the documents
    ```

    ```bash { data-md-color-scheme="slate" }
    mamba create -n annotation python=3.11 -y
    mamba activate annotation
    pip install -r requirements.txt
    ```

When JupyterLab runs in another environment, register this one as a notebook kernel, then select it in the
top-right corner of your notebooks:

```bash { data-md-color-scheme="slate" }
pip install ipykernel
python -m ipykernel install --user --name annotation
```

JupyterLab then needs the sidebar and tabs of Metanno, installed in this environment: run this command in it once,
then refresh JupyterLab in your browser.

```bash { data-md-color-scheme="slate" }
pret update-jupyter-config --apply
```

It links the front-end files of Metanno and Pret into your Jupyter data folder
(`~/.local/share/jupyter/labextensions`), which JupyterLab reads whatever its own environment.

## Check your installation

Run this cell in a notebook:

```python { .render-with-pret }
from pret import component
from pret_joy import Button


@component
def SanityCheckApp():
    return Button("Metanno is installed ✅", sx={"m": 1})


SanityCheckApp()
```

A button appears below the cell when JupyterLab and your kernel are ready. Nothing shows up? Check that the kernel
of the notebook is the environment where you installed Metanno: `import sys; print(sys.executable)` prints its path.

## Databases and the explorer kernel

The `metanno-explorer` kernel reads the databases listed in `metanno-home/metanno.yaml`, as shown in
[Browse a database](tutorials/browse-a-database.md). Install it, with the Ibis driver of each database, in the
environment that can reach these databases:

```bash { data-md-color-scheme="slate" }
pip install metanno 'ibis-framework[duckdb]'
python -m metanno.viewer.explorer_kernel --install
```

Install each driver through its Ibis extra, eg `'ibis-framework[pyspark]'` for Spark, even when the driver itself comes
from another package index: the extra also installs the packages Ibis needs to read its results.

Registering records the Python executable that ran the command, so this environment can differ from the ones of
JupyterLab and of your notebooks, which do not need the explorer kernel to open notebook data.

??? note "The sidebar says the explorer kernel is missing"

    Run the registration command above in the intended environment, then click <span class="ui-button">Retry</span>
    in the sidebar. `jupyter kernelspec list`, run in the environment of JupyterLab, lists the kernels JupyterLab
    can find. When JupyterLab runs as another user or on another machine, its administrator must register the
    kernel there, with a Python executable available on that machine.

    The settings button <span class="ui-button">⚙</span> still works while the kernel is missing, and notebook views
    still open in their own kernels.
