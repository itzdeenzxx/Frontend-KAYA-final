const fs = require('fs');
let text = fs.readFileSync('src/pages/AdminKaya.tsx', 'utf8');

text = text.replace(`            <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            <Button onClick={handleCreate} className="bg-orange-500 hover:bg-ora
nge-600 text-white">สร้าง</Button>                                                         </DialogFooter>
        </DialogContent>
      </Dialog>`, `            <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">สร้าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>`);

fs.writeFileSync('src/pages/AdminKaya.tsx', text);
