import 'package:flutter/material.dart';

class SupplierScreen extends StatelessWidget {
  const SupplierScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Supplier')),
      body: const Center(child: Text('Supplier screen — scaffold only')),
    );
  }
}
