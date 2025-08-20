# Set up a new project

Learn how to install **Metanno** in a brand‑new project or add it to an existing one.

## Prerequisites

- Python >= 3.7
- A clean environment (Conda/Mamba recommended).
  **On JupyterHub:** use a **conda/mamba** environment (or micromamba). Avoid local environments like `venv` there to ensure JupyterLab picks up the front‑end code properly.

!!! tip "Two ways to run Metanno"

    - **Inside JupyterLab** (great for notebooks and quick prototyping)
    - **Standalone app** (run a local web server)

## Create (or reuse) a project

You can manage your project dependencies with a pyproject.toml or a requirements.txt.

=== "pyproject.toml"
    Below is a minimal example that starts from a dummy project and adds a dependency group for metanno:

    ```toml
    [project]
    name = "my-app"
    version = "0.1.0"
    requires-python = ">=3.7"
    dependencies = [
      "edsnlp>=0.17",  # example base dependency
    ]

    [dependency-groups]
    metanno = [
      "metanno",   # the annotation framework
      # add other dependencies as your annotation app grows
    ]
    ```

    Create and activate an environment, then (re-)install your project with the `metanno` group:

    ```bash { data-md-color-scheme="slate" }
    mamba create -n metanno python=3.11 -y
    mamba activate metanno
    pip install . --group metanno
    ```

    If you are **adding to an existing project**, just merge the `[dependency-groups]` section above and reinstall with `pip install . --group metanno`

=== "requirements.txt"
    If you don’t want a pyproject.toml, create a requirements.txt:

    ```text
    metanno
    edsnlp>=0.13  # example additional dependency, not required at the moment
    ```

    Then install in your environment:

    ```bash { data-md-color-scheme="slate" }
    mamba create -n metanno python=3.11 -y
    mamba activate metanno
    pip install -r requirements.txt
    ```

## Use in **JupyterLab**

1. If JupyterLab was already open, **refresh the browser tab** after installation.
2. Create a new notebook
3. Make sure you’re using the **Conda/Mamba** environment where you installed Metanno.
   To check, run the following in a new cell:
   ```python
   import sys

   print(sys.executable)
   ```
   It should show the path to the environment where you installed the app.
   If it does, you can skip to the next step.
   Otherwise, select the correct environment from the dropdown menu in the top‑right of the notebook.
   If your environment does not appear, it means you have not yet "linked" it to JupyterLab.
   Run the following command in the terminal:
   ```bash { data-md-color-scheme="slate" }
   mamba activate metanno
   pip install ipykernel
   python -m ipykernel install --user --name metanno
   ```
4. Then run the following dummy app in a new cell:

```python { .render-with-pret }
from pret import component
from pret.ui.joy import Button


@component
def SanityCheckApp():
    return Button("Metanno is installed ✅", sx={"m": 1})


SanityCheckApp()
```

If you see a clickable button appear below the cell, your JupyterLab setup is good to go.


## Use as a **standalone app**

Create a file `app.py` with the same minimal app and run it locally.
Ensure that you are in an environment where you can open ports (for instance port 5000 as in the example below), or contact your sysadmin.

```python
from pret import run, component
from pret.ui.joy import Button


@component
def SanityCheckApp():
    return Button("Metanno is installed ✅", sx={"m": 1})


if __name__ == "__main__":
    run(SanityCheckApp(), port=5000)
```

Run the app:

```bash { data-md-color-scheme="slate" }
python app.py
```

Your terminal will print a local URL. Open it in your browser and you should see the button displayed.
