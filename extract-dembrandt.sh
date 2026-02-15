#!/bin/sh

COMMAND="pnpx dembrandt"

$COMMAND https://m3.material.io/ --save-output
$COMMAND https://www.microsoft.com/en-us/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook --save-output
$COMMAND https://carbondesignsystem.com/ --save-output
$COMMAND https://zed.dev/ --save-output
$COMMAND https://www.recombee.com/ --save-output
$COMMAND https://stripe.com/ --save-output
$COMMAND https://react.dev/ --save-output
$COMMAND https://old.reddit.com/ --save-output
$COMMAND https://www.theguardian.com/europe --save-output
$COMMAND https://news.ycombinator.com/ --save-output

echo "Extraction complete."
