# wp-post

wp-post can convert articles created in markdown to html and post them to wordpress.

# markdown
In addition to general markdown descriptions, the following are extended.
* container
   
  * detail
    ```
    ::: detail test1 
    here be dragons
    :::
    ```
  * note
    ```
    ::: note primary
    Primary
    :::

    ::: note info
    Info
    :::

    ::: note alert
    alert
    :::
    ```
  * sticky
    ```
    ::: sticky st-blue
    content
    :::
    ```
  * label
    ```
    ::: label title
    content
    :::
    ```
  * speech
      ```
      ::: speech {"image":"<imagePath>","name":"<name>"}
      talk content A.
      :::


      ::: speech {"image":"<imagePath>","name":"<name>","opposite":true}
      talk content B.
      :::
      ```
* uml
    * mermaid
      ~~~md
      ```mermaid
      graph TD;
          A-->B;
          A-->C;
          B-->D;
          C-->D;
      ```


      ```mermaid
      sequenceDiagram
          Alice->>John: Hello John, how are you?
          John-->>Alice: Great!
      ```
      ~~~
* linkCard
Link description with line breaks above and below
    ```
    link1
    [link1](https://hydro-cloud.com)

    [link2](https://hydro-cloud.com/windows_sketch_aws-architectureicons)
    ```
>the current version sets the css class name according to the wordpress template: cocoon style, but we plan to make it customizable in a later version upgrade.

# Installing
## Package manager
Using npm:
```
$ npm install wp-post
```

# Example

## Usage

The following is the folder and file structure.
```
post01
├── images
│   └── test-b.png
├── post01.md
└── post01.png
```

~~~md
---
title: post'title
status: draft
---

# title
test

<p>test1</p>

```java
public class Hoge{
}
```
![](images/test-b.png)
~~~


### wppost
Convert the markdown file to HTML and post it to WordPress.
```js
import { wppost } from "wp-post";

const docPath = "./post01/post01.md";
const apiUrl = config.apiUrl; // e.g https://example.com/wp-json/wp/v2
const authUser = config.authUser;// e.g userName,mail
const authPassword = config.authPassword;// e.g "xxxs xxxs xxxs xxxs xxxs xxxx"

//
const postId = await wppost(docPath, apiUrl, authUser, authPassword);
console.log(postId): // post id
```

### getLinks , getFileReferences
`getLinks` detects the link status of images in the markdown, 
`getFileReferences` detects the link status of image files in the folder where the markdown is located.
```js
import { getLinks, getFileReferences } from "wp-post";

const docPath = "./post01/post01.md";
const results1 = getLinks(docPath);
console.log(results1): //  images that cannot be referenced in markdown.

const results2 = getFileReferences(docPath);
console.log(results2): // A list of the referencing status of files.
```
>`getFileReferences`
The default file extensions to be targeted are ".png", ".jpg", and ".gif". They can be specified as a string array in the first argument, for example, [" .png", ".jpg", ".gif"].


### class files
The above process is defined in the following classes: `WPPost` and `MDChecker`. These can also be used.
#### WPPost
```js
const wpost = new WPPost(docPath);

//
const html = wpost.render();

//
const apiUrl = config.apiUrl;
const authUser = config.authUser;
const authPassword = config.authPassword;
//
const postId = await wpost.post(apiUrl, authUser, authPassword);
```
#### MDChecker
```js
const checker = new MDChecker(docPath);

const results1 = checker.getFileReferences();
const results2 = checker.getLinks();
```

## Command Line
### wppost
Convert the markdown file to HTML and post it to WordPress.

Execute the command as follows:
```
$ wppost filePath -a <apiUrl> -u <userName> -p "<password>"
```


Here is the execution result made closer to the actual command:
```
$ wppost ./post01/post01.md -a https://example.com/wp-json/wp/v2 -u hogehoge -p "xxxs xxxs xxxs xxxs xxxs xxxx"
complete:😀  2294
```
After *complete:😀*, the `POSTID` that was posted will be displayed.

### mdchecker
Detect broken image links or images that are not used in the markdown.

The following is the folder and file structure.
```
sample
├── images
│   ├── test-a.png
│   ├── test-b.png
│   └── test01.png
├── sample.md
└── sample.png
```
The markdown file is written as follows:

./sample/sample.md
~~~md
# sample!

![test1](images/test01.png)
![test2](images/test02.png)
~~~

Execute the command as follows:
```
$ mdchecker ./sample/sample.md
```
result:
```
$ mdchecker ./sample/sample.md
target:
./sample/sample.md
dir:
./sample

📄 markdown :🌱 2 ⚠️ 1 📥 workspace : 🌱 2 ⚠️ 2

📄 markdown
 🌱 sample\sample.png
 🌱 sample\images\test01.png
 ⚠️ sample\images\test02.png
📥 workspace
 ⚠️ sample\images\test-a.png
 ⚠️ sample\images\test-b.png
 🌱 sample\images\test01.png
 🌱 sample\sample.png
```
🌱 will be displayed for paths that exist correctly, and ⚠️ will be displayed for paths that do not exist or are not referenced.