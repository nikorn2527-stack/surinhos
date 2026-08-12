import 'package:flutter/material.dart';

enum SurinhosPalette { indigo, emerald, blue, slate, purple, teal }

class SurinhosThemeOption {
  const SurinhosThemeOption({
    required this.palette,
    required this.name,
    required this.description,
    required this.primary,
    required this.light,
    required this.dark,
    required this.swatches,
  });

  final SurinhosPalette palette;
  final String name;
  final String description;
  final Color primary;
  final Color light;
  final Color dark;
  final List<Color> swatches;
}

const surinhosThemeOptions = <SurinhosThemeOption>[
  SurinhosThemeOption(
    palette: SurinhosPalette.indigo,
    name: 'Indigo',
    description: 'โทนสีคราม สุขุม น่าเชื่อถือ',
    primary: Color(0xff4f46e5),
    light: Color(0xffeef2ff),
    dark: Color(0xff3730a3),
    swatches: [Color(0xff4f46e5), Color(0xff6366f1), Color(0xffa5b4fc), Color(0xffe0e7ff)],
  ),
  SurinhosThemeOption(
    palette: SurinhosPalette.emerald,
    name: 'Emerald',
    description: 'โทนสีเขียว สดชื่น เป็นมิตร',
    primary: Color(0xff059669),
    light: Color(0xffecfdf5),
    dark: Color(0xff065f46),
    swatches: [Color(0xff059669), Color(0xff10b981), Color(0xff6ee7b7), Color(0xffd1fae5)],
  ),
  SurinhosThemeOption(
    palette: SurinhosPalette.blue,
    name: 'Blue',
    description: 'โทนน้ำเงิน สะอาด ทันสมัย',
    primary: Color(0xff2563eb),
    light: Color(0xffeff6ff),
    dark: Color(0xff1e40af),
    swatches: [Color(0xff2563eb), Color(0xff3b82f6), Color(0xff93c5fd), Color(0xffdbeafe)],
  ),
  SurinhosThemeOption(
    palette: SurinhosPalette.slate,
    name: 'Slate',
    description: 'โทนสีเทา เรียบง่าย มืออาชีพ',
    primary: Color(0xff374151),
    light: Color(0xfff9fafb),
    dark: Color(0xff111827),
    swatches: [Color(0xff374151), Color(0xff6b7280), Color(0xff9ca3af), Color(0xffe5e7eb)],
  ),
  SurinhosThemeOption(
    palette: SurinhosPalette.purple,
    name: 'Purple',
    description: 'โทนสีม่วง สร้างสรรค์ ล้ำสมัย',
    primary: Color(0xff9333ea),
    light: Color(0xfffaf5ff),
    dark: Color(0xff581c87),
    swatches: [Color(0xff9333ea), Color(0xffa855f7), Color(0xffc4b5fd), Color(0xffede9fe)],
  ),
  SurinhosThemeOption(
    palette: SurinhosPalette.teal,
    name: 'Teal',
    description: 'โทนสีทีล สมดุล ชัดเจน',
    primary: Color(0xff0d9488),
    light: Color(0xfff0fdfa),
    dark: Color(0xff115e59),
    swatches: [Color(0xff0d9488), Color(0xff14b8a6), Color(0xff99f6e4), Color(0xffccfbf1)],
  ),
];

class ThemePicker extends StatefulWidget {
  const ThemePicker({
    super.key,
    this.initialPalette = SurinhosPalette.teal,
    this.initialMode = ThemeMode.light,
    this.onSaved,
  });

  final SurinhosPalette initialPalette;
  final ThemeMode initialMode;
  final void Function(SurinhosPalette palette, ThemeMode mode)? onSaved;

  @override
  State<ThemePicker> createState() => _ThemePickerState();
}

class _ThemePickerState extends State<ThemePicker> {
  late SurinhosPalette _draftPalette;
  late ThemeMode _draftMode;

  SurinhosThemeOption get _selectedTheme => surinhosThemeOptions.firstWhere(
        (theme) => theme.palette == _draftPalette,
      );

  @override
  void initState() {
    super.initState();
    _draftPalette = widget.initialPalette;
    _draftMode = widget.initialMode;
  }

  void _save() {
    widget.onSaved?.call(_draftPalette, _draftMode);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 900;
        final content = _buildPickerCard(context);
        final preview = _buildPreviewCard(context);

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: isWide
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 6, child: content),
                    const SizedBox(width: 24),
                    Expanded(flex: 4, child: preview),
                  ],
                )
              : Column(
                  children: [content, const SizedBox(height: 24), preview],
                ),
        );
      },
    );
  }

  Widget _buildPickerCard(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('เลือกธีมสี', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('ปรับโทนสีให้เหมาะกับการใช้งาน', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600])),
            const SizedBox(height: 20),
            LayoutBuilder(
              builder: (context, constraints) {
                final columns = constraints.maxWidth >= 720 ? 3 : constraints.maxWidth >= 420 ? 2 : 1;
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: surinhosThemeOptions.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: columns,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.45,
                  ),
                  itemBuilder: (context, index) => _buildThemeCard(surinhosThemeOptions[index]),
                );
              },
            ),
            const Divider(height: 40),
            Text('โหมดการแสดงผล', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            SegmentedButton<ThemeMode>(
              segments: const [
                ButtonSegment(value: ThemeMode.light, icon: Icon(Icons.light_mode_outlined), label: Text('โหมดสว่าง')),
                ButtonSegment(value: ThemeMode.dark, icon: Icon(Icons.dark_mode_outlined), label: Text('โหมดมืด')),
              ],
              selected: {_draftMode},
              onSelectionChanged: (value) => setState(() => _draftMode = value.first),
            ),
            const SizedBox(height: 24),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: _save,
                icon: const Icon(Icons.save_outlined),
                label: const Text('บันทึกธีม'),
                style: FilledButton.styleFrom(backgroundColor: _selectedTheme.primary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeCard(SurinhosThemeOption theme) {
    final selected = _draftPalette == theme.palette;

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => setState(() => _draftPalette = theme.palette),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? theme.light : null,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? theme.primary : Colors.grey.shade300, width: selected ? 2 : 1),
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: theme.swatches.map((color) => Padding(padding: const EdgeInsets.only(right: 6), child: _swatch(color))).toList()),
                const Spacer(),
                Text(theme.name, style: TextStyle(fontWeight: FontWeight.bold, color: selected ? theme.dark : null)),
                const SizedBox(height: 3),
                Text(theme.description, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
              ],
            ),
            if (selected)
              Positioned(
                top: 0,
                right: 0,
                child: CircleAvatar(radius: 12, backgroundColor: theme.primary, child: const Icon(Icons.check, color: Colors.white, size: 15)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _swatch(Color color) => Container(width: 22, height: 22, decoration: BoxDecoration(color: color, shape: BoxShape.circle));

  Widget _buildPreviewCard(BuildContext context) {
    final theme = _selectedTheme;
    final dark = _draftMode == ThemeMode.dark;
    final surface = dark ? const Color(0xff1f2937) : Colors.white;
    final background = dark ? const Color(0xff111827) : const Color(0xfff8fafc);
    final text = dark ? Colors.white : const Color(0xff111827);

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ตัวอย่างการแสดงผล', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Preview: ${theme.name} · ${dark ? 'Dark' : 'Light'}', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[600])),
            const SizedBox(height: 16),
            Container(
              height: 300,
              decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(12), border: Border.all(color: dark ? Colors.grey.shade700 : Colors.grey.shade200)),
              child: Column(
                children: [
                  Container(height: 42, padding: const EdgeInsets.symmetric(horizontal: 12), color: surface, child: Row(children: [Icon(Icons.inventory_2_outlined, size: 18, color: theme.primary), const SizedBox(width: 8), Text('ระบบบริหารจัดการครุภัณฑ์', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: text)), const Spacer(), Icon(Icons.notifications_none, size: 18, color: text)])),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('ภาพรวม', style: TextStyle(fontWeight: FontWeight.bold, color: text)),
                        const SizedBox(height: 12),
                        Row(children: List.generate(2, (index) => Expanded(child: Container(margin: EdgeInsets.only(right: index == 0 ? 8 : 0), padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: index == 0 ? theme.primary : surface, borderRadius: BorderRadius.circular(8)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(index == 0 ? 'ครุภัณฑ์ทั้งหมด' : 'ใช้งานอยู่', style: TextStyle(fontSize: 10, color: index == 0 ? Colors.white : Colors.grey[600])), const SizedBox(height: 4), Text(index == 0 ? '1,248' : '982', style: TextStyle(fontWeight: FontWeight.bold, color: index == 0 ? Colors.white : text))])))),
                        const SizedBox(height: 12),
                        Expanded(child: Container(width: double.infinity, decoration: BoxDecoration(color: surface, borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Container(width: 100, height: 8, color: text), const SizedBox(height: 12), ...List.generate(3, (index) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [Expanded(child: Container(height: 6, color: dark ? Colors.grey[700] : Colors.grey[200])), const SizedBox(width: 8), Container(width: 36, height: 14, color: theme.light)])))]))),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text('* ตัวอย่างนี้แสดงโครงสร้างหน้าจอเพื่อประกอบการเลือกธีมเท่านั้น', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[500])),
          ],
        ),
      ),
    );
  }
}
