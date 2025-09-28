
cd ..

# 4) Copy ALL build output into the repo root
cp -r scratch-gui/build/* .

# 5) Confirm the key files are now present
ls -la | sed -n '1,80p'
# You should see: index.html, gui.js, static/ (folder), asset-manifest.json, etc.

# 6) Commit and push
git add -A
git commit -m "Add built Scratch editor (index.html, gui.js, static/)"
git push origin main