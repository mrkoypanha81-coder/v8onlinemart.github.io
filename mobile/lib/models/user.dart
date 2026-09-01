class User {
  final String id;
  final String phone;
  final bool phoneVerified;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.phone,
    required this.phoneVerified,
    this.createdAt,
    this.updatedAt,
  });

  /// Factory constructor to parse User object from JSON map.
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      phone: json['phone'] ?? '',
      phoneVerified: json['phoneVerified'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  /// Converts User object to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'phoneVerified': phoneVerified,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  @override
  String toString() => 'User(id: $id, phone: $phone, phoneVerified: $phoneVerified)';
}
