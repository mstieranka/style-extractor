#!/bin/sh

COMMAND="pnpm tsx extract-css.ts"

$COMMAND https://m3.material.io/ data/manual/01-material.css
$COMMAND https://www.microsoft.com/en-us/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook data/manual/02-m365.css
$COMMAND https://carbondesignsystem.com/ data/manual/03-carbon.css
$COMMAND https://zed.dev/ data/manual/04-zed.css
$COMMAND https://www.recombee.com/ data/manual/05-recombee.css
$COMMAND https://stripe.com/ data/manual/06-stripe.css
$COMMAND https://react.dev/ data/manual/07-react.css
$COMMAND https://old.reddit.com/ data/manual/08-reddit.css
$COMMAND https://www.theguardian.com/europe data/manual/09-guardian.css
$COMMAND https://news.ycombinator.com/ data/manual/10-hackernews.css

echo "Extraction complete."
