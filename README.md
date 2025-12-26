# csplanner
Helpers for cuescore tournament managers

Depending on the browser and platform different developer settings might need to be enabled.

Once in a cuescore tournament page, you type the name of the bookmark created above in the address bar and you select it. After that the following will be made available

1. Rows of games that can be started will be marked with a green color
2. A table on/off section will be showed (deactivating a table will show it as red on the table selector)
3. the table selector shows the same info as in the windows desktop version (tables in use are highlighted differently)
4. a count of the maximum number of games that can be started is shown on the top right (once clicked it shows in the center on a focus mode)

<img width="1317" height="868" alt="image" src="https://github.com/user-attachments/assets/e0d8c1f1-d90c-4b3f-9343-9b922d3f0614" />

Mobile view

<img width="819" height="777" alt="image" src="https://github.com/user-attachments/assets/4c279d1e-e5fc-4588-9940-16ce5ca13bb2" />

## Tampermonkey installation (If you have a pc/linux/android prefer this method)

- Install the Tampermonkey extension (available for chrome, edge, safari) [installation guide](https://www.tampermonkey.net/faq.php#Q100)
  - [chrome extension](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)
  - [safari extension](https://apps.apple.com/app/tampermonkey/id6738342400)
  - [firefox extension](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
  - [edge extension](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd)
- Enable developer mode and user scripts for it [instructions](https://www.tampermonkey.net/faq.php#Q209)
- Go to the [src/planner.user.js](https://github.com/pixelgrid/csplanner/blob/main/src/planner.user.js) file and click the Raw button (tampermonkey will open up automatically)
<img width="439" height="161" alt="image" src="https://github.com/user-attachments/assets/3a00a54d-8697-4182-a782-bc98ea0245f3" />

- Click install on the top right or reinstall

<img width="1710" height="351" alt="image" src="https://github.com/user-attachments/assets/e10a83fb-2902-4c8b-a636-f80d9612d5e6" />


## Userscripts installation (If you have a ipad/mac prefer this method)

- Install the usersscripts safari extension [link](https://apps.apple.com/us/app/userscripts/id1463298887)
- Allow the extension from Settings -> Safari -> Extensions -> Userscripts
- Go to the plugins sourcecode [link](https://github.com/pixelgrid/csplanner/raw/refs/heads/main/src/planner.user.js)
- Click the safari extensions icon
- 
  <img width="143" height="94" alt="image" src="https://github.com/user-attachments/assets/e6cf57f3-6131-4266-98d5-ffc7b4a5595b" />
- Click install
-
- <img width="417" height="178" alt="image" src="https://github.com/user-attachments/assets/ffd674af-fc32-42a7-af8a-cf7c74bc57d8" />

Make sure the Userscripts extension is allowed to access github.com and cuescore.com pages


