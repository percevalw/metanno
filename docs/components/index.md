# Building blocks

Metanno views are built from two kinds of blocks. The widgets of `DataWidgetFactory` are connected to a Store:
they read its rows, save the edits and share the selected row with each other, and most views, like the ones of
the [tutorials](../tutorials/index.md), only use them. Under them, the components only display what they receive,
and let you write what happens on each click or selection.

| Block | What it is |
| --- | --- |
| [DataWidgetFactory](data-widget-factory.md) | tables, texts, forms and PDFs connected to a Store, the usual way to build a view |
| [AnnotatedText][metanno.ui.AnnotatedText] | a text with highlighted spans, reporting the text you select and the spans you click |
| [AnnotatedImage][metanno.ui.AnnotatedImage] | an image with boxes and shapes drawn on it, reporting the shapes you draw |
| [Table][metanno.ui.Table] | rows in an editable grid, reporting the cells you edit and select |

Use the components directly when the factory widgets do not fit, for instance to decide yourself what a text
selection adds. The [front page](../index.md#compose-your-own-components) shows a text and a table built this way.
All these blocks are [Pret](https://percevalw.github.io/pret/) components: they work in Metanno tabs, notebook
outputs and web apps alike.
